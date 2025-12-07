import { motion } from "framer-motion"

function ThemeToggle() {
  const { isDark, toggleDark } = useDark()

  return (
    <button
      type="button"
      onClick={toggleDark}
      className={$([
        "fixed top-4 right-4 z-50",
        "p-2 rounded-full",
        "bg-white/90 dark:bg-neutral-800/90",
        "backdrop-blur-sm",
        "shadow-md",
        "border border-neutral-200/50 dark:border-neutral-700/50",
        "text-neutral-600 dark:text-neutral-300",
        "hover:bg-neutral-100 dark:hover:bg-neutral-700",
        "transition-colors duration-200",
        "cursor-pointer",
      ])}
      style={{ cursor: "pointer" }}
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
    >
      <span className={$([isDark ? "i-ph-sun-dim-duotone" : "i-ph-moon-stars-duotone", "text-xl block"])} />
    </button>
  )
}

export function LoginPage() {
  const { login, enableLogin } = useLogin()
  const { isDark } = useDark()

  // If login is not enabled (server not configured), show a message
  if (!enableLogin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-base">
        <div className="text-center p-8">
          <div className="h-16 w-16 mx-auto mb-4 bg-cover" style={{ backgroundImage: "url(/icon-briefcast.svg)" }} />
          <h1 className="text-2xl font-bold mb-2">Briefcast</h1>
          <p className="text-neutral-500">Authentication is not configured on this server.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-base relative">
      {/* Theme toggle */}
      <ThemeToggle />

      {/* Background pattern */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className={$([
            "absolute -top-1/2 -right-1/2 w-full h-full",
            "rounded-full opacity-10",
            isDark ? "bg-accent-400" : "bg-accent-500",
            "blur-3xl",
          ])}
        />
        <div
          className={$([
            "absolute -bottom-1/2 -left-1/2 w-full h-full",
            "rounded-full opacity-5",
            isDark ? "bg-accent-300" : "bg-accent-600",
            "blur-3xl",
          ])}
        />
      </div>

      {/* Main content */}
      <div className="flex-1 flex items-center justify-center relative z-10 px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-md w-full"
        >
          {/* Logo and branding */}
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="h-20 w-20 mx-auto mb-6 bg-cover"
              style={{ backgroundImage: "url(/icon-briefcast.svg)" }}
            />
            <h1 className="text-4xl font-bold mb-3 font-[Baloo_2]">
              Briefcast
            </h1>
            <p className="text-lg text-neutral-500 dark:text-neutral-400">
              Your personalized news, beautifully curated
            </p>
          </div>

          {/* Login card */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className={$([
              "bg-white/80 dark:bg-neutral-800/80",
              "backdrop-blur-xl",
              "rounded-2xl",
              "p-8",
              "shadow-xl shadow-neutral-200/50 dark:shadow-black/30",
              "border border-neutral-200/50 dark:border-neutral-700/50",
            ])}
          >
            <h2 className="text-xl font-semibold mb-2 text-center">
              Welcome back
            </h2>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 text-center mb-6">
              Sign in to access your personalized feed and sync your preferences across devices
            </p>

            {/* Login button */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={login}
              className={$([
                "w-full py-3 px-4",
                "bg-accent-500 hover:bg-accent-600",
                "dark:bg-accent-600 dark:hover:bg-accent-500",
                "text-white font-medium",
                "rounded-xl",
                "transition-colors duration-200",
                "flex items-center justify-center gap-2",
                "shadow-lg shadow-accent-500/25",
                "cursor-pointer!",
              ])}
            >
              <span className="i-ph:sign-in-duotone text-xl" />
              <span>Sign in</span>
            </motion.button>
          </motion.div>

          {/* Footer note */}
          <p className="text-center text-xs text-neutral-400 dark:text-neutral-500 mt-6">
            By signing in, you agree to our terms of service and privacy policy
          </p>
        </motion.div>
      </div>

      {/* Bottom branding */}
      <div className="py-6 text-center text-sm text-neutral-400 dark:text-neutral-500 relative z-10">
        <span className="font-mono">Briefcast</span>
        <span className="mx-2">·</span>
        <span>Real-time news aggregation</span>
      </div>
    </div>
  )
}
