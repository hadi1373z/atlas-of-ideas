"""Offline integration tests. No GitHub credentials or network requests."""
import copy,hashlib,json,re,shutil,sys,tempfile,unittest
from pathlib import Path
from unittest.mock import patch
ROOT=Path(__file__).resolve().parents[1];sys.path.insert(0,str(ROOT))
from tools.catalogue import BASELINE_SHA256,ValidationError,apply_events,canonical,load,revision
from tools.ingest import ingest
from tools.verify_live import verify
from tools.publish_github import files_to_publish,bootstrap,APIError
from build import build

class PublishingTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.base=json.loads((ROOT/'src/catalogue.json').read_text())
    def setUp(self):
        self.tmp=tempfile.TemporaryDirectory();self.root=Path(self.tmp.name)
        shutil.copytree(ROOT/'src',self.root/'src');(self.root/'content/updates').mkdir(parents=True)
    def tearDown(self):self.tmp.cleanup()
    def event(self,kind='profile-edit',person='godel'):
        old=next(p for p in self.base['people'] if p['id']==person)
        e={'schema_version':1,'event_id':'edit-2026-09-25-godel-test','source_key':'edit:2026-09-25:godel:test','created_at':'2026-09-25T12:00:00Z','kind':kind,'person_id':person,'base_revision':revision(old),'summary':'Automated local test, not a published article','profile':{'bio':old['bio']+' Local test sentence.'}}
        if kind=='daily-profile':e.update(event_id='daily-2026-09-25',source_key='daily:2026-09-25',article_markdown='# Local test article\n\nFull test text only.\n')
        return e
    def new_event(self):
        e=self.event('daily-profile')
        e['person_id']='integration-test';e['base_revision']=None
        e['profile']={'name':'Integration Test Person','born':1900,'field':'logic','title':'Test only','bio':'Synthetic regression fixture.','formula':'1 = 1','impact':'Test only.','sections':[{'title':'A test section','text':'First paragraph.\n\nSecond paragraph.','math':'1 = 1'}],'sources':[{'label':'Placeholder test source','url':'https://example.org/'}],'questions':['First question?','Second question?','Third question?']}
        return e
    def store(self,e):
        p=self.root/'content/updates'/(e['event_id']+'.json');p.write_text(json.dumps(e));return p
    def test_01_original_catalogue_unchanged(self):
        self.assertEqual(hashlib.sha256((ROOT/'src/catalogue.json').read_bytes()).hexdigest(),BASELINE_SHA256)
        data,index,history=load(self.root)
        self.assertEqual(data,self.base);self.assertEqual(len(data['people']),118);self.assertEqual(len(data['connections']),150);self.assertEqual(len(data['trails']),8);self.assertEqual(history,[])
    def test_02_source_tamper_stops_build(self):
        (self.root/'src/catalogue.json').write_text('{}')
        with self.assertRaises(ValidationError):load(self.root)
    def test_03_new_profile_and_publication(self):
        self.store(self.new_event());data,index,h=load(self.root)
        self.assertEqual(len(data['people']),119);self.assertEqual(h[0]['article_markdown'],'# Local test article\n\nFull test text only.\n')
        self.assertTrue(index['people'][-1]['already_profiled']);self.assertEqual(data['people'][:118],self.base['people'])
    def test_04_edit_preserves_id_and_omitted_fields(self):
        self.store(self.event());data,_,_=load(self.root)
        old=next(p for p in self.base['people'] if p['id']=='godel');new=next(p for p in data['people'] if p['id']=='godel')
        self.assertEqual({k:v for k,v in old.items() if k!='bio'},{k:v for k,v in new.items() if k!='bio'})
    def test_05_stale_revision_rejected(self):
        e=self.event();e['base_revision']='0'*64;self.store(e)
        with self.assertRaisesRegex(ValidationError,'Stale'):load(self.root)
    def test_06_duplicate_person_name_normalized(self):
        e=self.new_event();e['profile']['name']='Kurt Godel';self.store(e)
        with self.assertRaisesRegex(ValidationError,'already exists under ID godel'):load(self.root)
    def test_07_duplicate_daily_key_rejected(self):
        a=self.event('daily-profile');b=copy.deepcopy(a)
        with self.assertRaisesRegex(ValidationError,'Duplicate'):apply_events(self.base,[a,b])
    def test_08_ingest_retry_noop(self):
        e=self.event();p=self.root/'payload.json';p.write_text(json.dumps(e))
        out,changed=ingest(p,self.root);self.assertTrue(changed)
        _,changed=ingest(p,self.root);self.assertFalse(changed)
        e['summary']='Changed retry';p.write_text(json.dumps(e))
        with self.assertRaisesRegex(ValidationError,'different content'):ingest(p,self.root)
    def test_09_ingest_bad_record_rolls_back(self):
        e=self.event();e['base_revision']='0'*64;p=self.root/'payload.json';p.write_text(json.dumps(e))
        with self.assertRaises(ValidationError):ingest(p,self.root)
        self.assertFalse(list((self.root/'content/updates').glob('*.json')))
    def test_10_private_and_unsafe_fields_rejected(self):
        for change in ({'notes':{'godel':'private'}},{'profile':{'mathSVG':'<svg onload="alert(1)"/>'}}):
            e=self.event();e.update(change)
            with self.assertRaises(ValidationError):apply_events(self.base,[e])
    def test_11_javascript_source_url_rejected(self):
        e=self.event();e['profile']={'sources':[{'label':'Bad source','url':'javascript:alert(1)'}]}
        with self.assertRaises(ValidationError):apply_events(self.base,[e])
    def test_12_equation_edit_removes_stale_svg_and_tex(self):
        e=self.event();e['profile']={'formula':'New plain-text equation'}
        data,_,_=apply_events(self.base,[e]);p=next(p for p in data['people'] if p['id']=='godel')
        self.assertNotIn('mathSVG',p);self.assertNotIn('tex',p)
    def test_13_two_edits_replay_without_losing_history(self):
        a=self.event();d,_,_=apply_events(self.base,[a]);old=next(p for p in d['people'] if p['id']=='godel')
        b=copy.deepcopy(a);b.update(event_id='edit-2026-09-26-godel-test',source_key='edit:2026-09-26:godel:test',created_at='2026-09-26T12:00:00Z',base_revision=revision(old),profile={'title':'Second test edit'})
        data,_,history=apply_events(self.base,[b,a]);self.assertEqual(len(history),2)
        person=next(p for p in data['people'] if p['id']=='godel');self.assertIn('Local test sentence.',person['bio']);self.assertEqual(person['title'],'Second test edit')
    def test_14_edges_idempotent_and_invalid_endpoint_rejected(self):
        e=self.event();e['connections_add']=[self.base['connections'][0]];d,_,_=apply_events(self.base,[e]);self.assertEqual(len(d['connections']),150)
        e['connections_add']=[{'source':'godel','target':'missing','label':'bad','description':'bad'}]
        with self.assertRaises(ValidationError):apply_events(self.base,[e])
    def test_15_build_artifact_and_notes_key(self):
        v=build(self.root);raw=(self.root/'_site/index.html').read_bytes()
        self.assertEqual(hashlib.sha256(raw).hexdigest(),v['html_sha256']);self.assertIn(b'atlas-of-ideas-v1',raw)
        self.assertFalse((self.root/'_site/src').exists());self.assertTrue((self.root/'_site/profiles/godel.json').exists())
        self.assertEqual(len(list((self.root/'_site/profiles').glob('*.json'))),118)
        self.assertIn(b'Publication journal',raw);self.assertNotIn(b'__PROFILE_COUNT__',raw)
    def test_16_manifest_verifier_checks_exact_bytes(self):
        v=build(self.root)
        def local(url):
            path=url.split('?')[0].replace('https://hadi1373z.github.io/atlas-of-ideas/','') or 'index.html'
            return (self.root/'_site'/path).read_bytes()
        with patch('tools.verify_live.fetch',side_effect=local):
            self.assertEqual(verify('https://hadi1373z.github.io/atlas-of-ideas/',expected_build=v['build_id'])['profiles'],118)
            with self.assertRaisesRegex(RuntimeError,'Update not yet'):verify('https://hadi1373z.github.io/atlas-of-ideas/',expected_event='not-present')
            (self.root/'_site/index.html').write_text('Wrong deployment')
            with self.assertRaisesRegex(RuntimeError,'bytes'):verify('https://hadi1373z.github.io/atlas-of-ideas/')
    def test_17_no_fake_daily_entries_in_production(self):
        for path in (ROOT/'content/updates').glob('*.json'):
            record=json.loads(path.read_text(encoding='utf-8'))
            self.assertNotEqual(record.get('person_id'),'integration-test')
            self.assertNotEqual(record.get('summary'),'Automated local test, not a published article')
    def test_18_strict_paths_questions_date_and_schema(self):
        bad=[{'event_id':'../escape'}, {'created_at':'2026-02-31T00:00:00Z'}, {'schema_version':3},{'profile':{'questions':['Only one?']}}]
        for change in bad:
            e=self.event();e.update(change)
            with self.assertRaises(ValidationError):apply_events(self.base,[e])
    def test_19_publish_allowlist_excludes_private_state(self):
        names=[p.relative_to(ROOT).as_posix() for p in files_to_publish(ROOT)]
        self.assertIn('.github/workflows/pages.yml',names);self.assertIn('src/catalogue.json',names)
        self.assertFalse(any(name.startswith('_site/') or '.env' in name or name.endswith('.zip') for name in names))
    def test_20_bootstrap_stops_on_permission_error(self):
        class Denied:
            calls=[]
            def call(self,method,path,payload=None):
                self.calls.append((method,path))
                if path=='repos/hadi1373z/atlas-of-ideas':return {'permissions':{'push':True},'default_branch':'main'}
                if '/git/ref/' in path:raise APIError(404,'empty')
                raise APIError(403,'Resource not accessible by integration')
        d=Denied();(self.root/'README.md').write_text('Readme')
        with self.assertRaises(APIError):bootstrap(d,self.root)
        self.assertEqual(len(d.calls),3)
    def test_21_baseline_history_flags(self):
        _,i,_=load(self.root)
        self.assertEqual(sum(p['already_profiled'] for p in i['people']),31)
        self.assertFalse(next(p for p in i['people'] if p['id']=='noether')['already_profiled'])
    def test_22_daily_requires_full_archived_text(self):
        e=self.event('daily-profile');e.pop('article_markdown')
        with self.assertRaisesRegex(ValidationError,'complete delivered article'):apply_events(self.base,[e])

if __name__=='__main__':unittest.main()
