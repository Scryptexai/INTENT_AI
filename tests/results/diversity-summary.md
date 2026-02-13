# 🧪 Profile Diversity Stress Test Report

**Date:** 2026-02-12T14:02:37.341Z
**Profiles Tested:** 107
**Tests Passed:** 15/15 (100%)
**Tests Failed:** 0/15

## Overall Verdict: ✅ ALL TESTS PASSED

---

## Test Results

| # | Test | Status | Details |
|---|------|--------|---------|
| 1 | V1: Valid Path Assignment | ✅ | ALL 107 profiles got valid paths |
| 2 | V2: All 6 Economic Models Covered | ✅ | 6/6 models covered: skill_service, audience_based, digital_product, commerce_arbitrage, data_research, automation_builder |
| 3 | V3: Path Distribution Balance | ✅ | Distribution: micro_service=43(40%), arbitrage_skill=7(7%), freelance_upgrade=29(27%), niche_content=24(22%), digital_product=4(4%) |
| 4 | V4: Segment Diversity | ✅ | 7 unique segments: low_capital_experimenter, risk_taker, long_term_builder, audience_builder, skill_leverager, service_executor, zero_capital_builder |
| 5 | V5: Profile Fingerprint Uniqueness | ✅ | 104/107 unique fingerprints (3 duplicates) |
| 6 | V6: Branching Workflow Uniqueness | ✅ | 70/107 unique workflow IDs |
| 7 | V7: Niche Resolution Success | ✅ | ALL 107 profiles resolved to valid niches |
| 8 | V8: Keyword Diversity Across Niches | ✅ | 55/107 unique keyword sets |
| 9 | V9: Trend Score Variation | ✅ | 37 unique scores, range 19–57 (spread=38) |
| 10 | V10: Lifecycle Stage Diversity | ✅ | 5 lifecycle stages present: emerging, peak, saturating, early_growth, declining |
| 11 | V11: Constraint Engine Differentiation | ✅ | 9 unique elimination patterns |
| 12 | V12: Edge Case — Absolute Zero User | ✅ | Zero user got path: micro_service, segment: low_capital_experimenter |
| 13 | V13: Edge Case — All Max User | ✅ | Max user got path: freelance_upgrade, segment: risk_taker, eliminated: 0 |
| 14 | V14: Platform Variation Creates Different Workflows | ✅ | 6/6 unique workflows for same niche, different platforms |
| 15 | V15: Deep Drill Niche Differentiation | ✅ | 5 unique niches from 20 deep-drill profiles |

---

## Path Distribution

| Path | Count | % |
|------|-------|---|
| micro_service | 43 | 40.2% |
| freelance_upgrade | 29 | 27.1% |
| niche_content | 24 | 22.4% |
| arbitrage_skill | 7 | 6.5% |
| digital_product | 4 | 3.7% |

---

## Segment Distribution

| Segment | Count | % |
|---------|-------|---|
| skill_leverager | 37 | 34.6% |
| risk_taker | 20 | 18.7% |
| audience_builder | 18 | 16.8% |
| low_capital_experimenter | 15 | 14.0% |
| service_executor | 12 | 11.2% |
| zero_capital_builder | 3 | 2.8% |
| long_term_builder | 2 | 1.9% |

---

## Sample Profiles (first 20)

### Profile #1: skill_service/writing/copywriting
- **Path:** micro_service (alt: none)
- **Segment:** low_capital_experimenter
- **Workflow:** `skill_service__writing__copywriting__fiverr`
- **Niche:** AI Copywriting (`skill.copywriting`)
- **Keywords:** AI ads copy, AI copywriting, AI email marketing, Google ads copywriter, cold email AI
- **Eliminated:** arbitrage_skill, digital_product, freelance_upgrade, high_risk_speculative, niche_content
- **Trend Scores:** AI copywriting=46(emerging), jasa copywriting=44(emerging), copywriter freelance=50(emerging)

### Profile #2: skill_service/design/branding
- **Path:** arbitrage_skill (alt: micro_service)
- **Segment:** low_capital_experimenter
- **Workflow:** `skill_service__design__branding__upwork`
- **Niche:** AI Design (`skill.design`)
- **Keywords:** AI design tool, branding, jasa desain, thumbnail designer
- **Eliminated:** digital_product, freelance_upgrade, high_risk_speculative
- **Trend Scores:** AI design tool=19(emerging), jasa desain=32(early_growth), thumbnail designer=20(emerging)

### Profile #3: skill_service/video/short_form
- **Path:** freelance_upgrade (alt: micro_service)
- **Segment:** risk_taker
- **Workflow:** `skill_service__video__short_form__linkedin`
- **Niche:** Video Production (`skill.video`)
- **Keywords:** AI video editing, jasa edit video, short form, video editor freelance
- **Eliminated:** none
- **Trend Scores:** jasa edit video=46(early_growth), video editor freelance=32(emerging), AI video editing=28(emerging)

### Profile #4: audience_based/content_creator/education
- **Path:** micro_service (alt: none)
- **Segment:** low_capital_experimenter
- **Workflow:** `audience_based__content_creator__education__youtube`
- **Niche:** Education (`audience.education`)
- **Keywords:** content creator, education, edukasi online, tips belajar, tutorial
- **Eliminated:** arbitrage_skill, digital_product, freelance_upgrade, high_risk_speculative, niche_content
- **Trend Scores:** tips belajar=37(emerging), edukasi online=47(early_growth), tutorial=31(early_growth)

### Profile #5: audience_based/micro_influencer/local_influencer
- **Path:** niche_content (alt: arbitrage_skill)
- **Segment:** low_capital_experimenter
- **Workflow:** `audience_based__micro_influencer__local_influencer__tiktok`
- **Niche:** Business & Startup (`audience.business`)
- **Keywords:** bisnis online, entrepreneurship tips, local influencer, micro influencer, startup Indonesia
- **Eliminated:** digital_product, freelance_upgrade, high_risk_speculative
- **Trend Scores:** bisnis online=19(saturating), startup Indonesia=54(early_growth), entrepreneurship tips=31(saturating)

### Profile #6: audience_based/niche_page/curated_page
- **Path:** digital_product (alt: niche_content)
- **Segment:** risk_taker
- **Workflow:** `audience_based__niche_page__curated_page__instagram`
- **Niche:** Tech & AI (`audience.tech`)
- **Keywords:** AI automation tools, AI news, AI tools terbaik, ChatGPT tips, Claude AI vs ChatGPT
- **Eliminated:** none
- **Trend Scores:** teknologi terbaru=41(peak), AI news=39(early_growth), software review=30(emerging)

### Profile #7: digital_product/ebook/how_to_guide
- **Path:** micro_service (alt: none)
- **Segment:** low_capital_experimenter
- **Workflow:** `digital_product__ebook__how_to_guide__gumroad`
- **Niche:** Ads Copywriting (`skill.copywriting.ads`)
- **Keywords:** AI ads copy, Google ads copywriter, how to guide, jasa iklan Facebook
- **Eliminated:** arbitrage_skill, digital_product, freelance_upgrade, high_risk_speculative, niche_content
- **Trend Scores:** jasa iklan Facebook=31(emerging), Google ads copywriter=28(saturating), AI ads copy=25(emerging)

### Profile #8: digital_product/template/canva_template
- **Path:** micro_service (alt: niche_content)
- **Segment:** low_capital_experimenter
- **Workflow:** `digital_product__template__canva_template__lemon_squeezy`
- **Niche:** Templates & Tools (`product.template`)
- **Keywords:** Figma template, Notion template, canva template, canva template premium, jual template canva
- **Eliminated:** digital_product, freelance_upgrade, high_risk_speculative
- **Trend Scores:** template bisnis=36(peak), Notion template=44(emerging), Figma template=56(early_growth)

### Profile #9: digital_product/prompt_pack/dev_prompts
- **Path:** digital_product (alt: freelance_upgrade)
- **Segment:** risk_taker
- **Workflow:** `digital_product__prompt_pack__dev_prompts__notion_market`
- **Niche:** AI Prompt Packs (`product.prompt_pack`)
- **Keywords:** AI prompt marketplace, Midjourney prompts, dev prompts, jual prompt ChatGPT, prompt pack
- **Eliminated:** none
- **Trend Scores:** jual prompt ChatGPT=39(peak), Midjourney prompts=55(early_growth), AI prompt marketplace=24(emerging)

### Profile #10: commerce_arbitrage/dropship/fashion_dropship
- **Path:** micro_service (alt: none)
- **Segment:** low_capital_experimenter
- **Workflow:** `commerce_arbitrage__dropship__fashion_dropship__shopee`
- **Niche:** Commerce & Arbitrage (`commerce_arbitrage`)
- **Keywords:** POD platform, arbitrase digital, bisnis online, cara dropshipping, dropship murah
- **Eliminated:** arbitrage_skill, digital_product, freelance_upgrade, high_risk_speculative, niche_content
- **Trend Scores:** bisnis online=31(emerging), dropshipping Indonesia=34(peak), arbitrase digital=25(saturating)

### Profile #11: commerce_arbitrage/print_on_demand/accessories_pod
- **Path:** micro_service (alt: arbitrage_skill)
- **Segment:** low_capital_experimenter
- **Workflow:** `commerce_arbitrage__print_on_demand__accessories_pod__tokopedia`
- **Niche:** Print on Demand (`commerce.print_on_demand`)
- **Keywords:** POD platform, accessories pod, jual kaos custom, print on demand, print on demand Indonesia
- **Eliminated:** digital_product, freelance_upgrade, high_risk_speculative
- **Trend Scores:** print on demand Indonesia=38(emerging), jual kaos custom=44(emerging), POD platform=40(emerging)

### Profile #12: commerce_arbitrage/affiliate/health_affiliate
- **Path:** arbitrage_skill (alt: high_risk_speculative)
- **Segment:** risk_taker
- **Workflow:** `commerce_arbitrage__affiliate__health_affiliate__tiktok_shop_plat`
- **Niche:** Digital Reselling (`commerce.digital_resell`)
- **Keywords:** health affiliate, jual lisensi digital, lifetime deal, resell software
- **Eliminated:** none
- **Trend Scores:** resell software=34(declining), lifetime deal=42(emerging), jual lisensi digital=36(emerging)

### Profile #13: data_research/trend_researcher/tech_trends
- **Path:** micro_service (alt: none)
- **Segment:** low_capital_experimenter
- **Workflow:** `data_research__trend_researcher__tech_trends__substack_dr`
- **Niche:** Data & Research (`data_research`)
- **Keywords:** data analysis, market research, riset pasar, tech trends, trend researcher
- **Eliminated:** arbitrage_skill, digital_product, freelance_upgrade, high_risk_speculative, niche_content
- **Trend Scores:** riset pasar=46(early_growth), data analysis=41(early_growth), market research=40(emerging)

### Profile #14: data_research/market_analyst/opportunity_mapping
- **Path:** micro_service (alt: arbitrage_skill)
- **Segment:** low_capital_experimenter
- **Workflow:** `data_research__market_analyst__opportunity_mapping__twitter_dr`
- **Niche:** Data & Research (`data_research`)
- **Keywords:** data analysis, market analyst, market research, opportunity mapping, riset pasar
- **Eliminated:** digital_product, freelance_upgrade, high_risk_speculative
- **Trend Scores:** riset pasar=46(early_growth), data analysis=41(early_growth), market research=40(emerging)

### Profile #15: data_research/crypto_analyst/defi_analysis
- **Path:** digital_product (alt: high_risk_speculative)
- **Segment:** risk_taker
- **Workflow:** `data_research__crypto_analyst__defi_analysis__linkedin_dr`
- **Niche:** Crypto & DeFi (`audience.finance.crypto`)
- **Keywords:** DeFi yield farming, bitcoin halving, crypto Indonesia 2026, crypto analyst, defi analysis
- **Eliminated:** none
- **Trend Scores:** crypto Indonesia 2026=28(emerging), bitcoin halving=35(emerging), DeFi yield farming=40(early_growth)

### Profile #16: automation_builder/nocode_builder/internal_tools
- **Path:** micro_service (alt: none)
- **Segment:** low_capital_experimenter
- **Workflow:** `automation_builder__nocode_builder__internal_tools__upwork_auto`
- **Niche:** Automation Builder (`automation_builder`)
- **Keywords:** Make.com, Zapier, bot Telegram, internal tools, no-code automation
- **Eliminated:** arbitrage_skill, digital_product, freelance_upgrade, high_risk_speculative, niche_content
- **Trend Scores:** no-code automation=36(emerging), Zapier=45(early_growth), Make.com=42(emerging)

### Profile #17: automation_builder/zapier_automation/ops_automation
- **Path:** micro_service (alt: arbitrage_skill)
- **Segment:** low_capital_experimenter
- **Workflow:** `automation_builder__zapier_automation__ops_automation__linkedin_auto`
- **Niche:** Automation Builder (`automation_builder`)
- **Keywords:** Make.com, Zapier, bot Telegram, no-code automation, ops automation
- **Eliminated:** digital_product, freelance_upgrade, high_risk_speculative
- **Trend Scores:** no-code automation=36(emerging), Zapier=45(early_growth), Make.com=42(emerging)

### Profile #18: automation_builder/crm_setup/startup_crm
- **Path:** micro_service (alt: high_risk_speculative)
- **Segment:** risk_taker
- **Workflow:** `automation_builder__crm_setup__startup_crm__direct_auto`
- **Niche:** Automation Builder (`automation_builder`)
- **Keywords:** Make.com, Zapier, bot Telegram, crm setup, no-code automation
- **Eliminated:** none
- **Trend Scores:** no-code automation=36(emerging), Zapier=45(early_growth), Make.com=42(emerging)

### Profile #19: ctx_variation_1
- **Path:** micro_service (alt: none)
- **Segment:** low_capital_experimenter
- **Workflow:** `skill_service__writing__copywriting__fiverr`
- **Niche:** AI Copywriting (`skill.copywriting`)
- **Keywords:** AI ads copy, AI copywriting, AI email marketing, Google ads copywriter, cold email AI
- **Eliminated:** arbitrage_skill, digital_product, freelance_upgrade, high_risk_speculative, niche_content
- **Trend Scores:** AI copywriting=46(emerging), jasa copywriting=44(emerging), copywriter freelance=50(emerging)

### Profile #20: ctx_variation_2
- **Path:** niche_content (alt: high_risk_speculative)
- **Segment:** risk_taker
- **Workflow:** `audience_based__micro_influencer__local_influencer__tiktok`
- **Niche:** Business & Startup (`audience.business`)
- **Keywords:** bisnis online, entrepreneurship tips, local influencer, micro influencer, startup Indonesia
- **Eliminated:** none
- **Trend Scores:** bisnis online=19(saturating), startup Indonesia=54(early_growth), entrepreneurship tips=31(saturating)


---

## Edge Cases

### edge_absolute_zero
> All minimums — should still get a valid path

- **Path:** micro_service
- **Segment:** low_capital_experimenter
- **Eliminated:** arbitrage_skill, digital_product, freelance_upgrade, high_risk_speculative, niche_content
- **Scores:** {"micro_service":1.4}

### edge_all_max
> All maximums — should get highest-tier path

- **Path:** freelance_upgrade
- **Segment:** risk_taker
- **Eliminated:** none
- **Scores:** {"freelance_upgrade":5.6499999999999995,"micro_service":5.15,"digital_product":5.1,"high_risk_speculative":4,"arbitrage_skill":3.65,"niche_content":3.5500000000000003}

### edge_high_risk_no_skill
> Wants high risk but zero skill — should NOT get speculative

- **Path:** micro_service
- **Segment:** zero_capital_builder
- **Eliminated:** arbitrage_skill, digital_product, freelance_upgrade, high_risk_speculative
- **Scores:** {"micro_service":2.5,"niche_content":0.8}

### edge_expert_no_time
> Expert but <1hr — should get quick-start path

- **Path:** micro_service
- **Segment:** skill_leverager
- **Eliminated:** arbitrage_skill, digital_product, freelance_upgrade, high_risk_speculative, niche_content
- **Scores:** {"micro_service":2.8}

### edge_big_audience_beginner
> Large audience but beginner — should monetize existing audience

- **Path:** niche_content
- **Segment:** audience_builder
- **Eliminated:** arbitrage_skill, digital_product, freelance_upgrade, high_risk_speculative
- **Scores:** {"niche_content":3.7000000000000006,"micro_service":1.4}

### edge_money_no_skill_no_time
> Has capital but nothing else — should get arbitrage/investment path

- **Path:** micro_service
- **Segment:** risk_taker
- **Eliminated:** arbitrage_skill, digital_product, freelance_upgrade, high_risk_speculative, niche_content
- **Scores:** {"micro_service":2.65}

### edge_skilled_cautious
> High skill, very low risk — should get safe execution path

- **Path:** freelance_upgrade
- **Segment:** service_executor
- **Eliminated:** arbitrage_skill, digital_product, high_risk_speculative
- **Scores:** {"freelance_upgrade":3.7,"micro_service":3,"niche_content":2.7}

### edge_student
> No money, no skill, lots of time, willing to learn

- **Path:** niche_content
- **Segment:** long_term_builder
- **Eliminated:** arbitrage_skill, digital_product, freelance_upgrade, high_risk_speculative
- **Scores:** {"niche_content":2.3,"micro_service":1.5}

