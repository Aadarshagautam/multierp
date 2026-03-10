import React, { useContext, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import api from '../../lib/api.js'
import AppContext from '../../context/app-context.js'

const EmailVerify = () => {
  const { isLoggedin, userData, getUserData } = useContext(AppContext)
  const navigate = useNavigate()
  const inputRef = React.useRef([])

  const handleInput = (e, index) => {
    if (e.target.value.length > 0 && index < inputRef.current.length - 1) {
      inputRef.current[index + 1].focus()
    }
  }

  const handleKeyDown = (e, index) => {
    if (e.key === 'Backspace' && e.target.value === '' && index > 0) {
      inputRef.current[index - 1].focus()
    }
  }

  const handlePaste = (e) => {
    const paste = e.clipboardData.getData('text')
    const pasteArray = paste.split('')
    pasteArray.forEach((char, index) => {
      if (inputRef.current[index]) {
        inputRef.current[index].value = char
      }
    })
  }

  const onSubmitHandler = async (e) => {
    try {
      e.preventDefault()
      const otp = inputRef.current.map((input) => input.value).join('')
      const { data } = await api.post('/auth/verify-account', { otp })

      if (data.success) {
        toast.success(data.message)
        getUserData()
        navigate('/')
      } else {
        toast.error(data.message)
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message)
    }
  }

  useEffect(() => {
    if (isLoggedin && userData?.isAccountVerified) {
      navigate('/')
    }
  }, [isLoggedin, navigate, userData])

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-amber-100 via-orange-50 to-teal-100 px-6 sm:px-0">
      <form onSubmit={onSubmitHandler} className="w-96 rounded-3xl border border-white/70 bg-slate-950/95 p-8 text-sm shadow-2xl shadow-slate-900/20 backdrop-blur">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-300">Account Security</p>
        <h1 className="mt-4 text-center text-2xl font-semibold text-white">Verify your email</h1>
        <p className="mb-6 mt-3 text-center text-slate-300">
          Enter the 6-digit code sent to your inbox to finish onboarding.
        </p>
        <div className="mb-8 flex justify-between" onPaste={handlePaste}>
          {Array(6).fill(0).map((_, index) => (
            <input
              key={index}
              type="text"
              maxLength="1"
              required
              className="h-12 w-12 rounded-2xl border border-slate-700 bg-slate-900 text-center text-xl text-white shadow-inner outline-none transition focus:border-amber-300 focus:ring-2 focus:ring-amber-200/40"
              ref={(el) => {
                inputRef.current[index] = el
              }}
              onInput={(e) => handleInput(e, index)}
              onKeyDown={(e) => handleKeyDown(e, index)}
            />
          ))}
        </div>
        <button className="w-full rounded-full bg-gradient-to-r from-amber-400 via-orange-400 to-teal-500 py-3 font-semibold text-slate-950 transition hover:brightness-105">
          Verify email
        </button>
      </form>
    </div>
  )
}

export default EmailVerify
