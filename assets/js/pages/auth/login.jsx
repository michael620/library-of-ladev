import { Link, Head, useForm } from '@inertiajs/react'
import { useState, useMemo } from 'react'
import NewAppLayout from '@/layouts/NewAppLayout.jsx';
import InputEmail from '@/components/InputEmail.jsx'
import InputPassword from '@/components/InputPassword.jsx'
import InputButton from '@/components/InputButton.jsx'
import GoogleButton from '@/components/GoogleButton.jsx'

Login.layout = (page) => <NewAppLayout children={page} />
export default function Login() {
  const { data, setData, ...form } = useForm({
    email: '',
    password: '',
    rememberMe: false
  })

  const disableLoginButton = useMemo(() => {
    if (!data.email) return true
    if (!data.password) return true
    if (form.processing) return true
    return false
  }, [data.email, data.password, form.processing])

  function submit(e) {
    e.preventDefault()
    form.post('/login')
  }
  return (
    <>
      <Head title="Login"></Head>
      <section className="flex min-h-screen flex-col justify-center bg-gradient-to-b from-brand-50/10 to-[#F9FAFB] text-black sm:items-center">
        <main className="mt-10 bg-white px-4 py-10 text-black sm:w-7/12 sm:rounded-lg sm:px-8 sm:shadow-lg md:w-6/12 lg:w-5/12 xl:w-4/12">
          <section className="mb-6 flex flex-col items-center justify-center space-y-2 text-center">
            <h1 className="text-2xl">Log in</h1>
            <p className="text-lg text-gray">
              Nothing to see here, admins only
            </p>
            {form.errors.email ||
              (form.errors.login && (
                <p className="my-4 w-full rounded-sm border-red-400 bg-red-100 p-4 text-red-500">
                  {form.errors.login || form.errors.email}
                </p>
              ))}
          </section>
          <form onSubmit={submit} className="mb-4 flex flex-col space-y-6">
            <InputEmail
              value={data.email}
              onChange={(e) => setData('email', e.target.value)}
            />
            <InputPassword
              value={data.password}
              onChange={(e) => setData('password', e.target.value)}
            />
            <InputButton
              processing={form.processing}
              disabled={disableLoginButton}
              label="Login"
            />
          </form>
        </main>
      </section>
    </>
  )
}
