export function useDarkMode() {
  const isDark = useState('darkMode', () => false)

  function apply(dark: boolean) {
    isDark.value = dark
    if (import.meta.client) {
      document.documentElement.classList.toggle('dark', dark)
      localStorage.setItem('darkMode', dark ? '1' : '0')
    }
  }

  function toggle() { apply(!isDark.value) }

  // Read saved preference on client mount
  onMounted(() => {
    const saved = localStorage.getItem('darkMode')
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    apply(saved !== null ? saved === '1' : prefersDark)
  })

  return { isDark, toggle }
}
