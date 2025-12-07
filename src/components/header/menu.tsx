import { motion } from "framer-motion"

function ThemeToggle() {
  const { isDark, toggleDark } = useDark()
  return (
    <li onClick={toggleDark} className="cursor-pointer [&_*]:cursor-pointer transition-all">
      <span className={$("inline-block", isDark ? "i-ph-moon-stars-duotone" : "i-ph-sun-dim-duotone")} />
      <span>
        {isDark ? "Light Mode" : "Dark Mode"}
      </span>
    </li>
  )
}

export function Menu() {
  const { loggedIn, login, logout, enableLogin, userInfo } = useLogin()
  const [shown, show] = useState(false)
  return (
    <span className="relative" onMouseEnter={() => show(true)} onMouseLeave={() => show(false)}>
      <span className="flex items-center">
        <button
          type="button"
          className="btn i-ph:gear-six-duotone"
        />
      </span>
      {shown && (
        <div className="absolute right-0 z-99 bg-transparent pt-4 top-4">
          <motion.div
            id="dropdown-menu"
            className={$([
              "w-200px",
              "bg-accent backdrop-blur-5 bg-op-70! rounded-lg shadow-xl",
            ])}
            initial={{
              scale: 0.9,
            }}
            animate={{
              scale: 1,
            }}
          >
            <ol className="bg-base bg-op-70! backdrop-blur-md p-2 rounded-lg color-base text-base">
              {enableLogin && (loggedIn
                ? (
                    <>
                      {userInfo?.name && (
                        <li className="cursor-default! hover:bg-transparent! flex items-center gap-2 pb-2 mb-1 border-b border-neutral-200/30 dark:border-neutral-700/30">
                          {userInfo.avatar
                            ? (
                                <img
                                  src={userInfo.avatar}
                                  alt={userInfo.name}
                                  className="w-6 h-6 rounded-full"
                                />
                              )
                            : (
                                <span className="i-ph:user-circle-duotone inline-block text-xl" />
                              )}
                          <span className="truncate text-sm font-medium">{userInfo.name}</span>
                        </li>
                      )}
                      <li onClick={logout}>
                        <span className="i-ph:sign-out-duotone inline-block" />
                        <span>Sign out</span>
                      </li>
                    </>
                  )
                : (
                    <li onClick={login}>
                      <span className="i-ph:sign-in-duotone inline-block" />
                      <span>Sign in</span>
                    </li>
                  ))}
              <ThemeToggle />
            </ol>
          </motion.div>
        </div>
      )}
    </span>
  )
}
