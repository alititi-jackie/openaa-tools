# DMV tools and reusable SEO article framework

Reviewed against NY ID-44 (2/26), NY DMV Green Light Law and REAL ID/Enhanced pages on 2026-10-03. Source URLs are rendered in each article. Search intent research used Chinese phrases (纽约驾照6分、中国护照考纽约驾照、没有SSN、白卡、地址证明) and official Chinese NYC material alongside English DMV entities. No keyword-volume estimates are asserted.

## URLs and content ownership

Four core .html URLs are unchanged. Articles remain flat under /usa/dmv/<slug>/; forty descriptive slugs are managed in one registry, tested for uniqueness. Existing ten article URLs remain available. One primary tool owns each article; cross-links lead to the other steps. Distinguish explanatory intent from checklist intent instead of publishing duplicate titles/answers.

src/data/seo-guides.json stores article content; src/data/guides.ts exposes a typed registry; GuideLayout renders the template. Tools automatically list their articles. Build generates the sitemap from the same registry. New tool families can use the same layout with their own paths, scope text and source list; do not copy a bespoke DMV template. Dates indicate source review, not invented publication dates.

## Template

Tool CTA first, breadcrumb, one H1, direct answer, realistic situation, document/condition explanation, mistakes, visible FAQ, tool CTA and next-step tools, official sources, related articles. Article and BreadcrumbList schemas correspond to visible content. FAQ is visible without FAQPage markup because OpenAA is not an authoritative government/health site eligible for Google's FAQ rich results. No promise of rankings or rich-result display.

## Qualification scope

Standard noncommercial driver license/permit is distinct from Non-Driver ID and CDL. EAD alone does not establish REAL ID lawful status. SSN number on MV-44 is accepted for REAL ID, not Enhanced. SSA ineligibility route for REAL ID requires letter within 30 days and matching DHS documentation. NY Title is residency proof; Registration is not. One proof per source/type. Electronic statements printed; identity originals/certified documents, name changes and translations checked separately.

## Verification

Unit cases cover citizen/noncitizen, EAD/status unknown, SSN number/card/alternative/ineligibility, one/two addresses, name/original confirmation, Non-Driver ID. Browser cases exercise actual results, shared navigation, deduction boundaries, all forty article routes and mobile fit. validate inspects the static artifact for metadata, H1, broken internal URLs and sitemap inclusion. Production release.json ties the deployment to its Git commit.
