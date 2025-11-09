'use client';

import { motion } from 'framer-motion';
import { SocialLink, SOCIAL_PLATFORMS } from '@/types/about';

interface SocialLinksProps {
  socialLinks: SocialLink[];
  showTitle?: boolean;
  variant?: 'default' | 'compact' | 'grid';
}

export default function SocialLinks({
  socialLinks,
  showTitle = true,
  variant = 'default'
}: SocialLinksProps) {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { scale: 0.8, opacity: 0 },
    visible: {
      scale: 1,
      opacity: 1,
      transition: { duration: 0.4, ease: 'easeOut' },
    },
  };

  const getPlatformInfo = (platform: string) => {
    return SOCIAL_PLATFORMS[platform as keyof typeof SOCIAL_PLATFORMS] || {
      icon: 'link',
      color: '#6B7280',
      label: platform,
    };
  };

  const renderSocialIcon = (icon: string, customIcon?: string) => {
    // 如果有自定义图标，优先使用
    if (customIcon) {
      return (
        <img
          src={customIcon}
          alt="Social Icon"
          className="w-5 h-5"
          onError={(e) => {
            // 如果图片加载失败，回退到默认图标
            const target = e.target as HTMLImageElement;
            target.style.display = 'none';
            const fallback = target.nextElementSibling as HTMLElement;
            if (fallback) fallback.style.display = 'block';
          }}
        />
      );
    }

    // 默认SVG图标（fallback）
    const iconMap: Record<string, JSX.Element> = {
      github: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
        </svg>
      ),
      twitter: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
        </svg>
      ),
      linkedin: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
        </svg>
      ),
      facebook: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
        </svg>
      ),
      instagram: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zM5.838 12a6.162 6.162 0 1112.324 0 6.162 6.162 0 01-12.324 0zM12 16a4 4 0 110-8 4 4 0 010 8zm4.965-10.405a1.44 1.44 0 112.881.001 1.44 1.44 0 01-2.881-.001z"/>
        </svg>
      ),
      mail: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      ),
      globe: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
        </svg>
      ),
    };

    return iconMap[icon] || (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
      </svg>
    );
  };

  if (socialLinks.length === 0) {
    return null;
  }

  const renderLinks = () => {
    return socialLinks.map((link, index) => {
      const platformInfo = getPlatformInfo(link.platform);
      const linkColor = link.color || platformInfo.color;
      const linkTitle = link.title || platformInfo.label;

      return (
        <motion.a
          key={link.id}
          href={link.url}
          target="_blank"
          rel="noopener noreferrer"
          variants={itemVariants}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className={`
            group relative flex items-center gap-3
            ${variant === 'compact' ? 'px-4 py-2 text-sm' : 'px-6 py-3'}
            bg-white dark:bg-gray-800 rounded-full
            border-2 border-gray-200 dark:border-gray-700
            hover:border-opacity-0 hover:shadow-lg
            transition-all duration-300
          `}
          style={{
            borderColor: variant === 'compact' ? 'transparent' : linkColor + '40',
          }}
          title={link.description || linkTitle}
        >
          {/* 图标 */}
          <div
            className="flex-shrink-0 flex items-center justify-center w-6 h-6"
            style={{ color: linkColor }}
          >
            {renderSocialIcon(link.platform, link.icon)}
            {/* fallback图标 */}
            <svg
              className="w-5 h-5 hidden"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
          </div>

          {/* 标题 */}
          {variant !== 'compact' && (
            <span className="font-medium text-gray-900 dark:text-white group-hover:text-gray-700 dark:group-hover:text-gray-300 transition-colors">
              {linkTitle}
            </span>
          )}

          {/* 悬停效果背景 */}
          <div
            className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-10 transition-opacity duration-300"
            style={{ backgroundColor: linkColor }}
          ></div>

          {/* 装饰点 */}
          <div
            className="absolute -top-1 -right-1 w-3 h-3 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"
            style={{ backgroundColor: linkColor }}
          ></div>
        </motion.a>
      );
    });
  };

  if (variant === 'grid') {
    return (
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.1 }}
        variants={containerVariants}
        className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
      >
        {socialLinks.map((link, index) => {
          const platformInfo = getPlatformInfo(link.platform);
          const linkColor = link.color || platformInfo.color;
          const linkTitle = link.title || platformInfo.label;

          return (
            <motion.a
              key={link.id}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              variants={itemVariants}
              whileHover={{
                scale: 1.05,
                y: -5,
              }}
              whileTap={{ scale: 0.95 }}
              className="group relative flex flex-col items-center gap-3 p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-md hover:shadow-2xl transition-all duration-300 border border-gray-100 dark:border-gray-700"
              title={link.description || linkTitle}
            >
              {/* 图标容器 */}
              <div
                className="flex items-center justify-center w-12 h-12 rounded-full"
                style={{ backgroundColor: linkColor + '20' }}
              >
                <div className="flex items-center justify-center w-6 h-6" style={{ color: linkColor }}>
                  {renderSocialIcon(link.platform, link.icon)}
                  <svg className="w-5 h-5 hidden" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                  </svg>
                </div>
              </div>

              {/* 标题 */}
              <span className="font-medium text-gray-900 dark:text-white text-center">
                {linkTitle}
              </span>

              {/* 装饰线 */}
              <div
                className="h-0.5 w-0 group-hover:w-full transition-all duration-300"
                style={{ backgroundColor: linkColor }}
              ></div>
            </motion.a>
          );
        })}
      </motion.div>
    );
  }

  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.1 }}
      variants={containerVariants}
      className="space-y-6"
    >
      {showTitle && (
        <motion.h3 variants={itemVariants} className="text-2xl font-bold text-gray-900 dark:text-white text-center">
          Connect With Me
        </motion.h3>
      )}

      <motion.div
        variants={containerVariants}
        className={`
          flex flex-wrap items-center justify-center gap-4
          ${variant === 'compact' ? 'gap-2' : 'gap-4'}
        `}
      >
        {renderLinks()}
      </motion.div>
    </motion.div>
  );
}