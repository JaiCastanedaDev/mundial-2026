const { createClient } = require('@supabase/supabase-js')

const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Define SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY antes de ejecutar el seed.')
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

const USERS = [
  { email: 'juan@gmail.com', password: 'Mundial2026!', username: 'juanc', display_name: 'Juan C.' },
  { email: 'maria@gmail.com', password: 'Mundial2026!', username: 'mariag', display_name: 'Maria G.' },
  { email: 'luis@gmail.com', password: 'Mundial2026!', username: 'luisp', display_name: 'Luis P.' },
  { email: 'ana@gmail.com', password: 'Mundial2026!', username: 'anav', display_name: 'Ana V.' },
]

function generateColor(seed) {
  let hash = 0
  for (let index = 0; index < seed.length; index += 1) {
    hash = seed.charCodeAt(index) + ((hash << 5) - hash)
  }

  const color = (hash & 0x00ffffff).toString(16).toUpperCase()
  return `#${'00000'.substring(0, 6 - color.length)}${color}`
}

async function main() {
  for (const user of USERS) {
    const { data, error } = await supabase.auth.admin.createUser({
      email: user.email,
      password: user.password,
      email_confirm: true,
    })

    if (error) throw error

    const { error: profileError } = await supabase.from('profiles').upsert({
      id: data.user.id,
      username: user.username,
      display_name: user.display_name,
      avatar_color: generateColor(user.username),
    })

    if (profileError) throw profileError
  }
}

main()
  .then(() => {
    console.log('Usuarios creados.')
  })
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
