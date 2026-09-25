/* Optional build-time typesetting. No MathJax script, network call or font file is
   needed by the finished website: only self-contained equation SVGs are stored. */
const fs = require('fs'), path=require('path');
const {mathjax}=require('mathjax-full/js/mathjax.js');
const {TeX}=require('mathjax-full/js/input/tex.js');
const {SVG}=require('mathjax-full/js/output/svg.js');
const {liteAdaptor}=require('mathjax-full/js/adaptors/liteAdaptor.js');
const {RegisterHTMLHandler}=require('mathjax-full/js/handlers/html.js');
const {AllPackages}=require('mathjax-full/js/input/tex/AllPackages.js');
const adaptor=liteAdaptor();RegisterHTMLHandler(adaptor);
const document=mathjax.document('',{InputJax:new TeX({packages:AllPackages}),OutputJax:new SVG({fontCache:'none'})});
const location=path.join(__dirname,'catalogue.json');
const D=JSON.parse(fs.readFileSync(location,'utf8'));
const eq={
 hilbert:String.raw`\sum_{i=1}^{m} g_i f_i = 1`,
 'von-neumann':String.raw`\max_{x}\min_{y}\;x^{\mathsf T}Ay=\min_{y}\max_{x}\;x^{\mathsf T}Ay`,
 godel:String.raw`T\models\varphi\quad\Longleftrightarrow\quad T\vdash\varphi`,
 turing:String.raw`U(\langle M,x\rangle)=M(x)`,
 erdos:String.raw`\mathbb{E}[X]<1\quad\Longrightarrow\quad\Pr[X=0]>0`,
 shannon:String.raw`H(X)=-\sum_x p(x)\log_2 p(x)`,
 nash:String.raw`u_i(s_i^*,s_{-i}^*)\geq u_i(s_i,s_{-i}^*)`,
 grothendieck:String.raw`X=\operatorname{Spec}(A)`,
 karp:String.raw`A\leq_{\mathrm p}B`,
 lovasz:String.raw`\alpha(G)\leq\vartheta(G)\leq\chi(\overline{G})`,
 valiant:String.raw`\operatorname{perm}(A)=\sum_{\sigma\in S_n}\prod_{i=1}^{n}a_{i,\sigma(i)}`,
 shamir:String.raw`\mathrm{IP}=\mathrm{PSPACE}`,
 goldwasser:String.raw`\operatorname{View}(P\leftrightarrow V^*)\approx S(x)`,
 babai:String.raw`\mathrm{GI}\in\mathrm{TIME}\!\left(\exp((\log n)^{O(1)})\right)`,
 nisan:String.raw`G:\{0,1\}^{s}\longrightarrow\{0,1\}^{R}`,
 lipton:String.raw`\mathrm{NP}\subseteq\mathrm{P/poly}\quad\Longrightarrow\quad\mathrm{PH}=\Sigma_2^{\mathrm P}`,
 fortnow:String.raw`\mathrm{MIP}=\mathrm{NEXP}`,
 vidick:String.raw`\mathrm{MIP}^{*}=\mathrm{RE}`,
 hastad:String.raw`\text{MAX-E3SAT:}\quad\frac78\ \text{approximation threshold}`,
 khot:String.raw`x_v=\pi_{uv}(x_u)`,
 odonnell:String.raw`f(x)=\sum_{S\subseteq[n]}\widehat f(S)\prod_{i\in S}x_i`,
 goemans:String.raw`\mathbb E[\mathrm{cut}]\geq 0.87856\cdot\mathrm{OPT}`,
 lasserre:String.raw`\widetilde{\mathbb E}[p^2]\geq0`,
 immerman:String.raw`\mathrm{NL}=\mathrm{coNL}`,
 nesetril:String.raw`\forall r\;\exists f(r):\quad\frac{|E(H)|}{|V(H)|}\leq f(r)`,
 euler:String.raw`e^{i\pi}+1=0`,
 noether:String.raw`\text{continuous symmetry}\ \longrightarrow\ \text{conservation law}`,
 gauss:String.raw`\sum_{k=1}^{n}k=\frac{n(n+1)}2`,
 deligne:String.raw`|\alpha|=q^{i/2}`
};
const sub={
 '∀x: p(0)p(1); ∃x: p(0)+p(1)−p(0)p(1)':String.raw`\begin{aligned}\forall x:\;&p(0)p(1)\\\exists x:\;&p(0)+p(1)-p(0)p(1)\end{aligned}`,
 'Rₓp = (1−x)p(0)+xp(1)':String.raw`R_xp=(1-x)p(0)+xp(1)`,
 'Pr[p(r)=q(r)] ≤ d / |F|':String.raw`\Pr[p(r)=q(r)]\leq\frac{d}{|\mathbb F|}`,
 'Ẽ[p²] ≥ 0':String.raw`\widetilde{\mathbb E}[p^2]\geq0`
};
let count=0;
function render(tex){const node=document.convert(tex,{display:true});let html=adaptor.outerHTML(node);if(html.includes('data-mjx-error'))throw Error('Invalid TeX: '+tex);count++;return html;}
for(const p of D.people){if(eq[p.id]){p.tex=eq[p.id];p.mathSVG=render(eq[p.id]);}for(const s of p.sections){const tex=sub[s.math]||(s.math===p.formula&&eq[p.id]);if(tex){s.tex=tex;s.mathSVG=render(tex);}}}
fs.writeFileSync(location,JSON.stringify(D,null,2));console.log(`Typeset ${count} mathematical expressions as self-contained SVGs.`);
