import { Metadata } from 'next';
import AboutHero from '@/components/about/AboutHero';
import SkillsSection from '@/components/about/SkillsSection';
import ExperienceTimeline from '@/components/about/ExperienceTimeline';
import SocialLinks from '@/components/about/SocialLinks';
import ContactSection from '@/components/about/ContactSection';
import { PersonalInfo, SkillGroup, SocialLink, Experience } from '@/types/about';

// 数据获取函数
async function getPersonalInfo(): Promise<PersonalInfo> {
  try {
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const response = await fetch(`${baseUrl}/api/settings?personal=true`, {
      cache: 'no-store',
    });

    if (!response.ok) {
      console.error('Failed to fetch personal info:', response.statusText);
      return getDefaultPersonalInfo();
    }

    const data = await response.json();
    return data.success ? data.data : getDefaultPersonalInfo();
  } catch (error) {
    console.error('Error fetching personal info:', error);
    return getDefaultPersonalInfo();
  }
}

async function getSkillGroups(): Promise<SkillGroup[]> {
  try {
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const response = await fetch(`${baseUrl}/api/skills?groups=true`, {
      cache: 'no-store',
    });

    if (!response.ok) {
      console.error('Failed to fetch skill groups:', response.statusText);
      return [];
    }

    const data = await response.json();
    return data.success ? data.data : [];
  } catch (error) {
    console.error('Error fetching skill groups:', error);
    return [];
  }
}

async function getExperiences(): Promise<Experience[]> {
  try {
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const response = await fetch(`${baseUrl}/api/experiences`, {
      cache: 'no-store',
    });

    if (!response.ok) {
      console.error('Failed to fetch experiences:', response.statusText);
      return [];
    }

    const data = await response.json();
    return data.success ? data.data : [];
  } catch (error) {
    console.error('Error fetching experiences:', error);
    return [];
  }
}

async function getSocialLinks(): Promise<SocialLink[]> {
  try {
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const response = await fetch(`${baseUrl}/api/social`, {
      cache: 'no-store',
    });

    if (!response.ok) {
      console.error('Failed to fetch social links:', response.statusText);
      return [];
    }

    const data = await response.json();
    return data.success ? data.data : [];
  } catch (error) {
    console.error('Error fetching social links:', error);
    return [];
  }
}

// 默认数据
function getDefaultPersonalInfo(): PersonalInfo {
  return {
    name: 'John Doe',
    bio: 'Full-stack developer passionate about creating amazing web experiences. I love working with modern technologies and building innovative solutions.',
    avatar: '',
    location: 'San Francisco, CA',
    website: 'https://johndoe.dev',
    email: 'john.doe@example.com',
    phone: '+1 (555) 123-4567',
    resume: '',
    tagline: 'Building the Future, One Line at a Time',
  };
}

// SEO metadata
export async function generateMetadata(): Promise<Metadata> {
  const personalInfo = await getPersonalInfo();

  return {
    title: `About ${personalInfo.name} | Personal Blog`,
    description: personalInfo.bio || `Learn more about ${personalInfo.name}, their skills, experience, and journey.`,
    keywords: [
      'about',
      'personal',
      'bio',
      'skills',
      'experience',
      'portfolio',
      'developer',
      personalInfo.name.toLowerCase(),
    ].filter(Boolean).join(', '),
    authors: [{ name: personalInfo.name }],
    openGraph: {
      title: `About ${personalInfo.name}`,
      description: personalInfo.bio,
      type: 'profile',
      url: '/about',
      images: personalInfo.avatar ? [
        {
          url: personalInfo.avatar,
          alt: `${personalInfo.name} - Profile Picture`,
          width: 1200,
          height: 630,
        },
      ] : [],
    },
    twitter: {
      card: 'summary_large_image',
      title: `About ${personalInfo.name}`,
      description: personalInfo.bio,
      images: personalInfo.avatar ? [personalInfo.avatar] : [],
    },
    alternates: {
      canonical: '/about',
    },
  };
}

// Schema.org structured data
function generateStructuredData(personalInfo: PersonalInfo) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: personalInfo.name,
    description: personalInfo.bio,
    email: personalInfo.email,
    url: personalInfo.website,
    jobTitle: 'Full-Stack Developer',
    sameAs: [
      personalInfo.website,
      // 这里可以添加社交媒体链接
    ].filter(Boolean),
  };
}

export default async function AboutPage() {
  // 并行获取所有数据
  const [personalInfo, skillGroups, experiences, socialLinks] = await Promise.all([
    getPersonalInfo(),
    getSkillGroups(),
    getExperiences(),
    getSocialLinks(),
  ]);

  const structuredData = generateStructuredData(personalInfo);

  return (
    <>
      {/* 结构化数据 */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData),
        }}
      />

      {/* 主要内容 */}
      <main className="min-h-screen">
        {/* Hero Section */}
        <AboutHero personalInfo={personalInfo} />

        {/* Social Links - Compact Version */}
        {socialLinks.length > 0 && (
          <section className="py-12 bg-white dark:bg-gray-900">
            <div className="container mx-auto px-4">
              <SocialLinks
                socialLinks={socialLinks}
                variant="compact"
                showTitle={false}
              />
            </div>
          </section>
        )}

        {/* Skills Section */}
        {skillGroups.length > 0 && <SkillsSection skillGroups={skillGroups} />}

        {/* Experience Timeline */}
        {experiences.length > 0 && <ExperienceTimeline experiences={experiences} />}

        {/* Contact Section */}
        <ContactSection personalInfo={personalInfo} />

        {/* Social Links - Grid Version */}
        {socialLinks.length > 0 && (
          <section className="py-20 bg-gray-50 dark:bg-gray-800">
            <div className="container mx-auto px-4">
              <div className="text-center mb-12">
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
                  Find Me Online
                </h2>
                <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
                  Connect with me on various platforms and follow my work
                </p>
              </div>
              <SocialLinks
                socialLinks={socialLinks}
                variant="grid"
                showTitle={false}
              />
            </div>
          </section>
        )}

        {/* 空状态提示 */}
        {skillGroups.length === 0 && experiences.length === 0 && socialLinks.length === 0 && (
          <section className="py-20 bg-white dark:bg-gray-900">
            <div className="container mx-auto px-4 text-center">
              <div className="max-w-2xl mx-auto">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-100 dark:bg-blue-900 rounded-full mb-6">
                  <svg className="w-10 h-10 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                  About Page Coming Soon
                </h3>
                <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">
                  I'm currently working on adding more details about my skills, experience, and projects. Check back soon for updates!
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                  <a
                    href={personalInfo.website || '#'}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                    Visit My Website
                  </a>
                  <a
                    href={`mailto:${personalInfo.email}`}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white font-medium rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    Send Email
                  </a>
                </div>
              </div>
            </div>
          </section>
        )}
      </main>
    </>
  );
}