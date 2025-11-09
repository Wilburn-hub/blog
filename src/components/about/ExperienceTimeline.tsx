'use client';

import { motion } from 'framer-motion';
import { Experience, EXPERIENCE_TYPES } from '@/types/about';

interface ExperienceTimelineProps {
  experiences: Experience[];
}

export default function ExperienceTimeline({ experiences }: ExperienceTimelineProps) {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.3,
        delayChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { x: -100, opacity: 0 },
    visible: {
      x: 0,
      opacity: 1,
      transition: { duration: 0.6, ease: 'easeOut' },
    },
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
    }).format(date);
  };

  const getDateRange = (startDate: Date, endDate?: Date, isCurrent?: boolean) => {
    const start = formatDate(startDate);
    if (isCurrent || !endDate) {
      return `${start} - Present`;
    }
    const end = formatDate(endDate);
    return `${start} - ${end}`;
  };

  const getTypeColor = (type: Experience['type']) => {
    switch (type) {
      case 'WORK':
        return 'bg-blue-500 text-white';
      case 'EDUCATION':
        return 'bg-green-500 text-white';
      case 'PROJECT':
        return 'bg-purple-500 text-white';
      case 'CERTIFICATION':
        return 'bg-yellow-500 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  const getTypeIcon = (type: Experience['type']) => {
    switch (type) {
      case 'WORK':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        );
      case 'EDUCATION':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
          </svg>
        );
      case 'PROJECT':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        );
      case 'CERTIFICATION':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
          </svg>
        );
      default:
        return null;
    }
  };

  // 按类型分组并排序
  const groupedExperiences = experiences.reduce((acc, exp) => {
    if (!acc[exp.type]) {
      acc[exp.type] = [];
    }
    acc[exp.type].push(exp);
    return acc;
  }, {} as Record<Experience['type'], Experience[]>);

  // 对每个类型内的经历按开始日期排序
  Object.keys(groupedExperiences).forEach(type => {
    groupedExperiences[type as Experience['type']].sort((a, b) => {
      // 当前职位优先
      if (a.isCurrent && !b.isCurrent) return -1;
      if (!a.isCurrent && b.isCurrent) return 1;
      // 按开始日期倒序
      return new Date(b.startDate).getTime() - new Date(a.startDate).getTime();
    });
  });

  const typeOrder: Experience['type'][] = ['WORK', 'EDUCATION', 'PROJECT', 'CERTIFICATION'];

  return (
    <section className="py-20 bg-gray-50 dark:bg-gray-800">
      <div className="container mx-auto px-4">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.1 }}
          variants={containerVariants}
          className="text-center mb-16"
        >
          <motion.h2
            variants={itemVariants}
            className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6"
          >
            Experience & Journey
          </motion.h2>
          <motion.p
            variants={itemVariants}
            className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto"
          >
            My professional journey, educational background, and key achievements
          </motion.p>
        </motion.div>

        {experiences.length > 0 ? (
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.1 }}
            variants={containerVariants}
            className="max-w-4xl mx-auto"
          >
            {typeOrder.map((type, typeIndex) => {
              const typeExperiences = groupedExperiences[type];
              if (!typeExperiences || typeExperiences.length === 0) return null;

              return (
                <motion.div
                  key={type}
                  variants={itemVariants}
                  className="mb-12"
                >
                  {/* 类型标题 */}
                  <div className="flex items-center justify-center mb-8">
                    <div className="flex items-center gap-3">
                      <div className={`p-3 rounded-full ${getTypeColor(type)}`}>
                        {getTypeIcon(type)}
                      </div>
                      <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                        {EXPERIENCE_TYPES[type]}
                      </h3>
                    </div>
                  </div>

                  {/* 时间线 */}
                  <div className="relative">
                    {/* 时间线主线 */}
                    <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-blue-500 to-purple-500"></div>

                    {/* 经历卡片 */}
                    {typeExperiences.map((experience, index) => (
                      <motion.div
                        key={experience.id}
                        variants={itemVariants}
                        className="relative flex items-start mb-8 last:mb-0"
                      >
                        {/* 时间线节点 */}
                        <div className="absolute left-6 w-4 h-4 bg-white dark:bg-gray-900 border-4 border-blue-500 rounded-full z-10"></div>

                        {/* 卡片内容 */}
                        <motion.div
                          initial={{ x: -50, opacity: 0 }}
                          whileInView={{ x: 0, opacity: 1 }}
                          viewport={{ once: true }}
                          transition={{
                            duration: 0.5,
                            delay: (typeIndex * 0.1) + (index * 0.1)
                          }}
                          whileHover={{
                            x: 10,
                            boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
                          }}
                          className="ml-20 bg-white dark:bg-gray-900 rounded-xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100 dark:border-gray-700 flex-1"
                        >
                          {/* 日期范围 */}
                          <div className="flex items-center justify-between mb-3">
                            <time className="text-sm font-medium text-blue-600 dark:text-blue-400">
                              {getDateRange(experience.startDate, experience.endDate, experience.isCurrent)}
                            </time>
                            {experience.isCurrent && (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                                Current
                              </span>
                            )}
                          </div>

                          {/* 职位/标题 */}
                          <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                            {experience.title}
                          </h4>

                          {/* 公司/机构 */}
                          {experience.company && (
                            <p className="text-lg text-gray-600 dark:text-gray-300 mb-2">
                              {experience.company}
                            </p>
                          )}

                          {/* 位置 */}
                          {experience.location && (
                            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-3">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                              </svg>
                              {experience.location}
                            </div>
                          )}

                          {/* 描述 */}
                          {experience.description && (
                            <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                              {experience.description}
                            </p>
                          )}

                          {/* 装饰元素 */}
                          <div className="absolute top-6 right-6 w-2 h-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full opacity-50"></div>
                        </motion.div>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center py-20"
          >
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full mb-6">
              <svg className="w-10 h-10 text-gray-400 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              No Experiences Available
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Experiences haven't been added yet. Check back later!
            </p>
          </motion.div>
        )}
      </div>
    </section>
  );
}