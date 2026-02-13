-- Seed data for tools table
-- Run this migration to populate sample AI tools

INSERT INTO public.tools (name, description, logo_url, website_url, category, pricing_min, pricing_max, pricing_model, rating, review_count, features, pros, cons, affiliate_link, created_at) VALUES
('ChatGPT', 'Advanced conversational AI for text generation, coding, and analysis', 'https://upload.wikimedia.org/wikipedia/commons/0/04/ChatGPT_logo.svg', 'https://chat.openai.com', ARRAY['Text AI', 'Chat', 'Coding'], 0, 20, 'freemium', 4.8, 1234, 
'{"context_window": "128K", "models": ["GPT-4", "GPT-3.5"], "voice": true, "image_input": true, "plugins": true, "web_browsing": true}'::jsonb, 
ARRAY['Very capable across many tasks', 'Large knowledge base', 'Good API documentation', 'Active development', 'Large community'],
ARRAY['Can be expensive at scale', 'Rate limits on free tier', 'Sometimes confidently wrong', 'Requires account'],
'https://openai.com/affiliate', NOW()),

('Claude', 'Thoughtful AI assistant for complex analysis and writing tasks', 'https://upload.wikimedia.org/wikipedia/commons/4/45/Anthropic_Favicon.svg', 'https://claude.ai', ARRAY['Text AI', 'Analysis', 'Writing'], 0, 20, 'freemium', 4.7, 987,
'{"context_window": "200K", "strengths": ["analysis", "long_form", "reasoning"], "pdf_support": true, "knowledge_cutoff": "April 2024"}'::jsonb,
ARRAY['Excellent analysis', 'Good with long documents', 'Thoughtful responses', 'Strong safety features'],
ARRAY['Slower responses', 'Less plugins', 'Smaller training data cutoff'],
'https://anthropic.com/affiliate', NOW()),

('Midjourney', 'AI art generator creating stunning images from text prompts', 'https://midjourney.com/favicon.ico', 'https://midjourney.com', ARRAY['Image AI', 'Art', 'Design'], 10, 120, 'subscription', 4.7, 876,
'{"models": ["Midjourney v6", "Niji v6"], "quality": "Exceptional", "style_versatility": "High", "upscaling": "2x, 4x"}'::jsonb,
ARRAY['Exceptional image quality', 'Very creative results', 'Great for design', 'Active community', 'Regular updates'],
ARRAY['Subscription required', 'Limited free trial', 'Discord-only interface', 'Queue during peak hours'],
'https://midjourney.com/affiliate', NOW()),

('Stable Diffusion', 'Open-source image generation model with extensive customization', 'https://huggingface.co/spaces/stabilityai/stable-diffusion-xl/file=favicon.png', 'https://stability.ai', ARRAY['Image AI', 'Open Source', 'Custom'], 0, 50, 'freemium', 4.5, 654,
'{"models": ["SDXL v1.0", "SD 1.5"], "open_source": true, "local_deployment": true, "fine_tuning": true, "api_available": true}'::jsonb,
ARRAY['Completely free to use', 'Open source', 'Run locally', 'Highly customizable', 'Large community'],
ARRAY['Steeper learning curve', 'Lower quality than Midjourney', 'Requires technical setup', 'Hardware intensive'],
'https://stability.ai/affiliate', NOW()),

('DALL-E 3', 'OpenAI''s advanced image generation with excellent text understanding', 'https://openai.com/favicon.ico', 'https://openai.com/dall-e-3', ARRAY['Image AI', 'Creative', 'Integration'], 0.015, 0.08, 'pay_per_use', 4.6, 543,
'{"quality": "Very High", "text_understanding": "Excellent", "resolution_options": ["1024x1024", "1792x1024", "1024x1792"], "edits": true}'::jsonb,
ARRAY['Great text rendering', 'Excellent understanding', 'High quality output', 'Easy to use', 'Well integrated with ChatGPT'],
ARRAY['Pay per image', 'Slower than Midjourney', 'Less artistic control'],
'https://openai.com/affiliate', NOW()),

('GitHub Copilot', 'AI pair programmer for code completion and generation', 'https://github.com/favicon.ico', 'https://github.com/features/copilot', ARRAY['Code AI', 'Development', 'IDE'], 10, 20, 'subscription', 4.7, 1100,
'{"integration": ["VSCode", "JetBrains", "Vim", "Neovim"], "free_for": "Students, open source", "context_awareness": true, "chat": true}'::jsonb,
ARRAY['Excellent code suggestions', 'Many IDE integrations', 'Reduces boilerplate', 'Free for students', 'Chat for discussion'],
ARRAY['Subscription required', 'Limited free tier', 'Training data concerns'],
'https://github.com/affiliate', NOW()),

('ElevenLabs', 'Realistic AI voice generation and text-to-speech', 'https://elevenlabs.io/favicon.ico', 'https://elevenlabs.io', ARRAY['Audio AI', 'Voice', 'TTS'], 0, 500, 'freemium', 4.6, 567,
'{"voices": "100+", "languages": "29", "voice_cloning": true, "api": true, "fine_tuning": true}'::jsonb,
ARRAY['Natural sounding voices', 'Voice cloning ability', 'Many languages', 'Good API', 'Good pricing'],
ARRAY['Free tier limited', 'Voice cloning has limits', 'Occasionally robotic'],
'https://elevenlabs.io/affiliate', NOW()),

('Runway ML', 'AI-powered video creation and editing tools', 'https://runwayml.com/favicon.ico', 'https://runwayml.com', ARRAY['Video AI', 'Creative', 'Editing'], 12, 76, 'subscription', 4.4, 432,
'{"features": ["text_to_video", "video_editing", "motion_tracking", "background_removal"], "quality": "Good", "export_options": ["1080p", "4K"]}'::jsonb,
ARRAY['Innovative features', 'Good video quality', 'Professional tools', 'Active development', 'Good support'],
ARRAY['Subscription required', 'Processing can be slow', 'Some features limited', 'Learning curve'],
'https://runwayml.com/affiliate', NOW()),

('Notion AI', 'AI writing assistant integrated into your workspace', 'https://notion.so/favicon.ico', 'https://notion.so', ARRAY['Productivity', 'Writing', 'Integration'], 10, 10, 'add_on', 4.3, 789,
'{"models": "GPT-4", "integration": "Native in Notion", "templates": true, "multilingual": true}'::jsonb,
ARRAY['Seamless Notion integration', 'Good for knowledge work', 'Affordable', 'Multiple templates', 'Works with existing docs'],
ARRAY['Limited to Notion', 'Less powerful than ChatGPT', 'Requires Notion Pro'],
'https://notion.so/affiliate', NOW()),

('Jasper', 'AI copywriting tool for marketing and content creation', 'https://jasper.ai/favicon.ico', 'https://www.jasper.ai', ARRAY['Content AI', 'Marketing', 'Copywriting'], 39, 299, 'subscription', 4.4, 456,
'{"templates": "50+", "languages": "25+", "tone_control": true, "plagiarism_check": true, "brand_voice": true}'::jsonb,
ARRAY['Great for marketing', 'Many templates', 'Brand voice training', 'Plagiarism checker', 'Good support'],
ARRAY['Expensive for individuals', 'Can be formulaic', 'Limited AI models'],
'https://jasper.ai/affiliate', NOW()),

('Copy.ai', 'User-friendly AI content generator for various writing needs', 'https://copy.ai/favicon.ico', 'https://www.copy.ai', ARRAY['Content AI', 'Writing', 'Marketing'], 0, 49, 'freemium', 4.1, 345,
'{"templates": "100+", "languages": "20+", "chat_feature": true, "team_collaboration": true}'::jsonb,
ARRAY['User friendly', 'Many templates', 'Affordable', 'Free tier available', 'Quick generations'],
ARRAY['Lower quality than premium tools', 'Limited customization', 'Can repeat itself'],
'https://copy.ai/affiliate', NOW()),

('HuggingFace', 'Hub for open-source AI models and datasets', 'https://huggingface.co/favicon.ico', 'https://huggingface.co', ARRAY['Open Source', 'Research', 'Models'], 0, 100, 'freemium', 4.3, 234,
'{"models": "100000+", "datasets": "10000+", "inference_api": true, "spaces": true, "collaboration": true}'::jsonb,
ARRAY['Huge model library', 'Free and open', 'Great community', 'Good documentation', 'Research focused'],
ARRAY['Learning curve steep', 'Less polished UX', 'Can be overwhelming', 'Requires technical skills'],
'https://huggingface.co/affiliate', NOW()),

('Cohere', 'Enterprise-ready NLP platform for text generation', 'https://cohere.ai/favicon.ico', 'https://cohere.ai', ARRAY['Text AI', 'Enterprise', 'NLP'], 0, 500, 'freemium', 4.2, 189,
'{"models": ["Command", "Summarize"], "languages": "100+", "api": true, "multilingual": true, "custom_models": true}'::jsonb,
ARRAY['Enterprise focus', 'Multilingual', 'Good API', 'Customizable', 'Reliable'],
ARRAY['Less popular than OpenAI', 'Steeper setup', 'Limited free tier'],
'https://cohere.ai/affiliate', NOW()),

('Synthesia', 'AI video generation with realistic avatars', 'https://www.synthesia.io/favicon.ico', 'https://www.synthesia.io', ARRAY['Video AI', 'Avatar', 'Training'], 30, 500, 'subscription', 4.5, 312,
'{"avatars": "150+", "languages": "120+", "voice_sync": true, "screen_recording": true, "templates": "200+"}'::jsonb,
ARRAY['Realistic avatars', 'Many languages', 'Quick to produce', 'Great for training', 'Template library'],
ARRAY['Expensive', 'Limited customization', 'Avatar limited emotions'],
'https://www.synthesia.io/affiliate', NOW()),

('Brainly', 'AI-powered homework help and tutoring platform', 'https://brainly.com/favicon.ico', 'https://brainly.com', ARRAY['Education', 'Learning', 'Tutoring'], 0, 12.99, 'freemium', 3.8, 567,
'{"subjects": "All", "languages": "40+", "community_help": true, "expert_tutors": true, "mobile_app": true}'::jsonb,
ARRAY['Large community', 'All subjects', 'Affordable', 'Expert tutors', 'Mobile friendly'],
ARRAY['Quality varies', 'Can have incorrect answers', 'Community dependent'],
'https://brainly.com/affiliate', NOW()),

('Fireflies.ai', 'AI meeting transcription and note-taking', 'https://fireflies.ai/favicon.ico', 'https://fireflies.ai', ARRAY['Productivity', 'Meeting', 'Audio'], 10, 100, 'freemium', 4.3, 234,
'{"transcription": "Real-time", "languages": "60+", "integrations": "100+", "search": true, "speaker_identification": true}'::jsonb,
ARRAY['Accurate transcription', 'Many integrations', 'Real-time', 'Good search', 'Affordable'],
ARRAY['Setup can be complex', 'Free tier limited', 'Occasional accuracy issues'],
'https://fireflies.ai/affiliate', NOW());
