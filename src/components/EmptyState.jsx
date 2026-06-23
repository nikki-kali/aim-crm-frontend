import { motion } from 'framer-motion'

export default function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  actionLabel,
  size = 'default',
}) {
  const isSmall = size === 'sm'
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`flex flex-col items-center justify-center text-center ${isSmall ? 'py-8 px-4' : 'py-16 px-6'}`}
    >
      {Icon && (
        <div className={`${isSmall ? 'w-10 h-10 mb-3' : 'w-14 h-14 mb-4'} rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center`}>
          <Icon size={isSmall ? 18 : 24} className="text-slate-400 dark:text-slate-500" />
        </div>
      )}
      <p className={`font-semibold text-slate-700 dark:text-slate-300 ${isSmall ? 'text-sm' : 'text-base'}`}>
        {title}
      </p>
      {description && (
        <p className={`text-slate-400 dark:text-slate-500 mt-1 max-w-xs ${isSmall ? 'text-xs' : 'text-sm'}`}>
          {description}
        </p>
      )}
      {action && actionLabel && (
        <button
          onClick={action}
          className="mt-4 btn-primary text-sm"
        >
          {actionLabel}
        </button>
      )}
    </motion.div>
  )
}
