'use client';

import { motion } from 'framer-motion';
import { Skill, SkillGroup, SKILL_CATEGORIES } from '@/types/about';

interface SkillsSectionProps {
  skillGroups: SkillGroup[];
}

export default function SkillsSection({ skillGroups }: SkillsSectionProps) {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const categoryVariants = {
    hidden: { y: 30, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.6, ease: 'easeOut' },
    },
  };

  const skillVariants = {
    hidden: { scale: 0.8, opacity: 0 },
    visible: {
      scale: 1,
      opacity: 1,
      transition: { duration: 0.4, ease: 'easeOut' },
    },
  };

  const getSkillLevelColor = (level: number) => {
    switch (level) {
      case 5:
        return 'bg-gradient-to-r from-green-500 to-emerald-500';
      case 4:
        return 'bg-gradient-to-r from-blue-500 to-cyan-500';
      case 3:
        return 'bg-gradient-to-r from-purple-500 to-pink-500';
      case 2:
        return 'bg-gradient-to-r from-yellow-500 to-orange-500';
      case 1:
        return 'bg-gradient-to-r from-gray-500 to-slate-500';
      default:
        return 'bg-gradient-to-r from-gray-400 to-gray-500';
    }
  };

  const getSkillLevelLabel = (level: number) => {
    switch (level) {
      case 5:
        return 'Expert';
      case 4:
        return 'Advanced';
      case 3:
        return 'Intermediate';
      case 2:
        return 'Beginner';
      case 1:
        return 'Learning';
      default:
        return 'Unknown';
    }
  };

  const getCategoryColor = (category: string) => {
    const colors = [
      'from-blue-500 to-cyan-500',
      'from-purple-500 to-pink-500',
      'from-green-500 to-emerald-500',
      'from-yellow-500 to-orange-500',
      'from-red-500 to-rose-500',
      'from-indigo-500 to-purple-500',
    ];

    const index = Math.abs(category.charCodeAt(0)) % colors.length;
    return colors[index];
  };

  return (
    <section className="py-20 bg-white dark:bg-gray-900">
      <div className="container mx-auto px-4">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.1 }}
          variants={containerVariants}
          className="text-center mb-16"
        >
          <motion.h2
            variants={categoryVariants}
            className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6"
          >
            Skills & Expertise
          </motion.h2>
          <motion.p
            variants={categoryVariants}
            className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto"
          >
            A comprehensive overview of my technical skills and areas of expertise
          </motion.p>
        </motion.div>

        {skillGroups.length > 0 ? (
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.1 }}
            variants={containerVariants}
            className="grid gap-12 md:gap-16"
          >
            {skillGroups.map((group, groupIndex) => (
              <motion.div
                key={group.category}
                variants={categoryVariants}
                className="space-y-8"
              >
                {/* 分类标题 */}
                <div className="text-center">
                  <motion.div
                    initial={{ scale: 0 }}
                    whileInView={{ scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ type: 'spring', stiffness: 200, damping: 15, delay: groupIndex * 0.1 }}
                    className="inline-block"
                  >
                    <h3 className={`text-2xl md:text-3xl font-bold bg-gradient-to-r ${getCategoryColor(group.category)} bg-clip-text text-transparent mb-2`}>
                      {SKILL_CATEGORIES[group.category as keyof typeof SKILL_CATEGORIES] || group.category}
                    </h3>
                    <div className={`h-1 w-20 bg-gradient-to-r ${getCategoryColor(group.category)} rounded-full mx-auto`}></div>
                  </motion.div>
                </div>

                {/* 技能卡片网格 */}
                <motion.div
                  variants={containerVariants}
                  className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6"
                >
                  {group.skills.map((skill, skillIndex) => (
                    <motion.div
                      key={skill.id}
                      variants={skillVariants}
                      whileHover={{
                        scale: 1.05,
                        boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
                      }}
                      whileTap={{ scale: 0.95 }}
                      className="group relative"
                    >
                      <div className="relative bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100 dark:border-gray-700">
                        {/* 技能名称 */}
                        <h4 className="font-semibold text-gray-900 dark:text-white text-center mb-3 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                          {skill.name}
                        </h4>

                        {/* 技能等级条 */}
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {getSkillLevelLabel(skill.level)}
                            </span>
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {skill.level}/5
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                            <motion.div
                              className={`h-full ${getSkillLevelColor(skill.level)} rounded-full`}
                              initial={{ width: 0 }}
                              whileInView={{ width: `${(skill.level / 5) * 100}%` }}
                              viewport={{ once: true }}
                              transition={{
                                duration: 0.8,
                                delay: (groupIndex * 0.1) + (skillIndex * 0.05),
                                ease: 'easeOut'
                              }}
                            ></motion.div>
                          </div>
                        </div>

                        {/* 技能描述 */}
                        {skill.description && (
                          <motion.p
                            initial={{ opacity: 0, height: 0 }}
                            whileHover={{
                              opacity: 1,
                              height: 'auto',
                              marginTop: '0.5rem'
                            }}
                            className="text-xs text-gray-600 dark:text-gray-300 overflow-hidden"
                          >
                            {skill.description}
                          </motion.p>
                        )}

                        {/* 装饰元素 */}
                        <div className="absolute -top-2 -right-2 w-4 h-4 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              </motion.div>
            ))}
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
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              No Skills Available
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Skills haven't been added yet. Check back later!
            </p>
          </motion.div>
        )}
      </div>
    </section>
  );
}