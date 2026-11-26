-- =============================================================================
-- Starter content for the portfolio chatbot.  REVIEW BEFORE RUNNING.
--
-- Every value below is copied from content that is already published on
-- anjitpariyar.com.np (components/Seo.js, pages/_document.js structured data,
-- public/llms.txt, the About page). Nothing here is new information.
--
-- Deliberately left empty because the site doesn't state them:
--   cv_url, availability_status, employment history
--   (portfolio_experiences), proficiency levels.
-- Fill those in the Supabase Table Editor when you're ready.
--
-- Safe to re-run: skills use ON CONFLICT (slug), and profile / FAQ /
-- suggestion inserts only run while their table is empty.
-- =============================================================================

-- Profile ---------------------------------------------------------------------
insert into public.portfolio_profile (
  full_name, professional_title, short_bio, detailed_bio, location,
  email, website, github_url, linkedin_url, other_links, years_experience,
  additional_information, is_published
)
select
  'Anjit Pariyar',
  'React Developer',
  'Anjit Pariyar is a React developer from Nepal with 5 years of experience. He has built 20+ web apps and loves solving problems and creating websites that users love.',
  E'From the start Anjit has thrived on solving problems and creating websites that users love.\n\nHe developed a knack for adding animations to websites, making them more engaging and interactive.\n\nOver the years he has become proficient in React.js, adept at handling performance optimization, ensuring responsiveness, and seamlessly integrating APIs to enhance user experiences.\n\nHe is dedicated to crafting user-friendly interfaces and leveraging technology to bring ideas to life on the web.',
  'Nepal',
  'anjitcoder@gmail.com',
  'https://www.anjitpariyar.com.np',
  'https://github.com/anjitpariyar',
  'https://www.linkedin.com/in/anjit-pariyar-b46131178/',
  '[{"label": "Dribbble", "url": "https://dribbble.com/limbo_anj"},
    {"label": "Instagram", "url": "https://www.instagram.com/limbo_anj/"}]'::jsonb,
  5,
  'He builds web apps with React and Next.js, has delivered 20+ projects, and focuses on interactive, animated frontends that users enjoy.',
  true
where not exists (select 1 from public.portfolio_profile);

-- Sets the email on a profile row that already exists (the insert above skips then).
-- Leaves an email you've already filled in untouched.
update public.portfolio_profile
set email = 'anjitcoder@gmail.com'
where email is null or btrim(email) = '';

-- Same for years of experience, so the chatbot can state it.
update public.portfolio_profile
set years_experience = 5
where years_experience is null;

-- Skills ----------------------------------------------------------------------
-- No proficiency_label / years_experience: the site doesn't state them per skill.
insert into public.portfolio_skills
  (name, slug, category, description, aliases, related_skills, is_featured, sort_order, is_published)
values
  ('React', 'react', 'Frontend',
   'His main tool: most of his web apps are built with React.',
   '{reactjs,react.js,react js}', '{nextjs,javascript,redux}', true, 10, true),
  ('Next.js', 'nextjs', 'Frontend',
   'He builds web apps with React and Next.js.',
   '{next js,nextjs}', '{react}', true, 20, true),
  ('JavaScript', 'javascript', 'Frontend', null,
   '{js,es6}', '{react}', true, 30, true),
  ('HTML', 'html', 'Frontend', null,
   '{html5}', '{css}', false, 40, true),
  ('CSS', 'css', 'Styling', null,
   '{css3}', '{html,responsive-design}', false, 50, true),
  ('Web animation', 'web-animation', 'Animation',
   'He has a knack for adding animations to websites, making them more engaging and interactive.',
   '{animation,animations,motion,interactive animation}', '{framer-motion,gsap,react-spring}', true, 60, true),
  ('Responsive design', 'responsive-design', 'Frontend',
   'Ensuring responsiveness is part of how he builds interfaces.',
   '{responsive,responsiveness,mobile friendly}', '{css}', false, 70, true),
  ('Performance optimization', 'performance-optimization', 'Frontend',
   'Adept at handling performance optimization in React apps.',
   '{performance,optimization,web performance}', '{react}', false, 80, true),
  ('API integration', 'api-integration', 'Frontend',
   'Integrates APIs to enhance user experiences.',
   '{api,apis,rest api,integration}', '{react}', false, 90, true),
  ('Web design', 'web-design', 'Other',
   'Crafting user-friendly interfaces.',
   '{ui,ui design,interface design,user interface}', '{}', false, 100, true)
on conflict (slug) do nothing;

-- FAQs ------------------------------------------------------------------------
insert into public.portfolio_faqs (question, answer, keywords, category, sort_order, is_published)
select * from (values
  ('What kind of projects does Anjit build?',
   'Mostly web apps built with React and Next.js, with a focus on interactive, animated frontends that users enjoy.',
   '{kind of projects,type of projects,what does he build,what do you build,specialize,specialise,focus}'::text[],
   'general', 10, true),
  ('How many projects has Anjit built?',
   'He has built 20+ projects over 5 years.',
   '{how many projects,number of projects,project count}'::text[],
   'general', 20, true),
  ('What is his preferred frontend stack?',
   'He builds web apps with React and Next.js.',
   '{preferred stack,favorite stack,favourite stack,go to stack,main stack,preferred frontend}'::text[],
   'skills', 30, true)
) as v(question, answer, keywords, category, sort_order, is_published)
where not exists (select 1 from public.portfolio_faqs);

-- Chat suggestions --------------------------------------------------------------
insert into public.portfolio_chat_suggestions (label, message, category, sort_order, is_published)
select * from (values
  ('Explore projects',        'Show me your projects',              'projects',   10, true),
  ('Technical skills',        'What technologies do you work with?', 'skills',     20, true),
  ('Next.js work',            'Have you worked with Next.js?',      'skills',     30, true),
  ('Animation work',          'Do you have experience with animations?', 'skills', 40, true),
  ('Professional experience', 'Tell me about your experience',      'experience', 50, true),
  ('Contact',                 'How can I contact you?',             'contact',    60, true)
) as v(label, message, category, sort_order, is_published)
where not exists (select 1 from public.portfolio_chat_suggestions);

-- Work experience ---------------------------------------------------------------
-- Intentionally empty: the site doesn't list employers. Template:
--
-- insert into public.portfolio_experiences
--   (company, position, employment_type, description, responsibilities,
--    start_date, end_date, is_current, technologies, company_url, sort_order, is_published)
-- values
--   ('Company name', 'Frontend Developer', 'Full-time', 'One-line summary',
--    '{"Built ...","Led ..."}', '2022-01-01', null, true,
--    '{React,Next.js}', 'https://company.example', 10, true);
