import { useState } from 'react'
import { useForm, type SubmitHandler } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link } from '@tanstack/react-router'
import { 
  Eye, 
  EyeOff, 
  Mail, 
  Lock, 
  User, 
  Loader2, 
  AlertCircle, 
  Check,
  X,
  UserPlus
} from 'lucide-react'
import { useToast } from '../components/ToastProvider'
import { Input } from '../components/ui/input'
import { Button } from '../components/ui/button'
import { Label } from '../components/ui/label'
import { useBetterAuth } from './index'
import { 
  signUpSchema, 
  type SignUpFormData, 
  validatePassword, 
  getPasswordStrength 
} from '../lib/validation'

interface SignUpFormProps {
  onSuccess?: (user: any) => void
}

export default function SignUpForm({ onSuccess }: SignUpFormProps) {
  const { register: signup, loading, error, clearError } = useBetterAuth()
  const { showSuccess, showError } = useToast()
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    watch,
  } = useForm<SignUpFormData>({
    resolver: zodResolver(signUpSchema),
    mode: 'onChange',
    defaultValues: {
      agreeToTerms: false
    }
  })

  const watchedValues = watch()
  const hasNameValue = watchedValues.name && watchedValues.name.length > 0
  const hasEmailValue = watchedValues.email && watchedValues.email.length > 0
  const hasPasswordValue = watchedValues.password && watchedValues.password.length > 0
  const hasConfirmPasswordValue = watchedValues.confirmPassword && watchedValues.confirmPassword.length > 0
  
  // Password strength validation
  const passwordErrors = watchedValues.password ? validatePassword(watchedValues.password) : []
  const passwordStrength = watchedValues.password ? getPasswordStrength(watchedValues.password) : 'weak'
  const passwordsMatch = watchedValues.password && watchedValues.confirmPassword && 
                        watchedValues.password === watchedValues.confirmPassword

  const onSubmit: SubmitHandler<SignUpFormData> = async ({ name, email, password }) => {
    if (isSubmitting) return
    
    setIsSubmitting(true)
    clearError()
    
    try {
      const result = await signup(email, password, name)
      if (result.success) {
        showSuccess('Welcome aboard!', 'Your account has been created successfully. Please sign in to continue.')
        if (onSuccess) onSuccess(result)
      } else {
        showError('Registration failed', result.error?.message || 'Unable to create your account. Please try again.')
      }
    } catch (err: any) {
      showError('Connection Error', 'Unable to connect to our servers. Please check your internet connection and try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword)
  }

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword)
  }

  const getPasswordStrengthColor = (strength: string) => {
    switch (strength) {
      case 'weak': return 'bg-red-500'
      case 'medium': return 'bg-yellow-500'
      case 'strong': return 'bg-green-500'
      default: return 'bg-gray-300'
    }
  }

  const getPasswordStrengthWidth = (strength: string) => {
    switch (strength) {
      case 'weak': return 'w-1/3'
      case 'medium': return 'w-2/3'
      case 'strong': return 'w-full'
      default: return 'w-0'
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <div className="w-full max-w-md space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-primary/10 mb-4">
            <UserPlus className="h-6 w-6 text-primary" />
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-gray-900">
            Create your account
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Already have an account?{' '}
            <Link
              to="/auth/signin"
              className="font-medium text-primary hover:text-primary/80 transition-colors"
            >
              Sign in here
            </Link>
          </p>
        </div>

        {/* Form */}
        <div className="bg-white py-8 px-6 shadow-lg rounded-xl border border-gray-100">
          {error && (
            <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-200 flex items-start space-x-3">
              <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-red-700">
                <p className="font-medium">Registration Error</p>
                <p>{error.message}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Name Field */}
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-medium text-gray-700">
                Full name
              </Label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className={`h-5 w-5 ${hasNameValue ? 'text-primary' : 'text-gray-400'} transition-colors`} />
                </div>
                <Input
                  id="name"
                  type="text"
                  autoComplete="name"
                  {...register('name')}
                  disabled={loading || isSubmitting}
                  placeholder="Enter your full name"
                  className={`pl-10 transition-all duration-200 ${
                    errors.name 
                      ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
                      : hasNameValue 
                      ? 'border-primary/30 focus:border-primary focus:ring-primary/20'
                      : 'focus:border-primary focus:ring-primary/20'
                  }`}
                />
              </div>
              {errors.name && (
                <p className="text-sm text-red-600 flex items-center space-x-1">
                  <AlertCircle className="h-4 w-4" />
                  <span>{errors.name.message}</span>
                </p>
              )}
            </div>

            {/* Email Field */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                Email address
              </Label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className={`h-5 w-5 ${hasEmailValue ? 'text-primary' : 'text-gray-400'} transition-colors`} />
                </div>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  {...register('email')}
                  disabled={loading || isSubmitting}
                  placeholder="Enter your email"
                  className={`pl-10 transition-all duration-200 ${
                    errors.email 
                      ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
                      : hasEmailValue 
                      ? 'border-primary/30 focus:border-primary focus:ring-primary/20'
                      : 'focus:border-primary focus:ring-primary/20'
                  }`}
                />
              </div>
              {errors.email && (
                <p className="text-sm text-red-600 flex items-center space-x-1">
                  <AlertCircle className="h-4 w-4" />
                  <span>{errors.email.message}</span>
                </p>
              )}
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                Password
              </Label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className={`h-5 w-5 ${hasPasswordValue ? 'text-primary' : 'text-gray-400'} transition-colors`} />
                </div>
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  {...register('password')}
                  disabled={loading || isSubmitting}
                  placeholder="Create a strong password"
                  className={`pl-10 pr-10 transition-all duration-200 ${
                    errors.password 
                      ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
                      : hasPasswordValue 
                      ? 'border-primary/30 focus:border-primary focus:ring-primary/20'
                      : 'focus:border-primary focus:ring-primary/20'
                  }`}
                />
                <button
                  type="button"
                  onClick={togglePasswordVisibility}
                  disabled={loading || isSubmitting}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
              
              {/* Password Strength Indicator */}
              {hasPasswordValue && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">Password strength</span>
                    <span className={`text-xs font-medium ${
                      passwordStrength === 'weak' ? 'text-red-500' :
                      passwordStrength === 'medium' ? 'text-yellow-500' :
                      'text-green-500'
                    }`}>
                      {passwordStrength.charAt(0).toUpperCase() + passwordStrength.slice(1)}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className={`h-2 rounded-full transition-all duration-300 ${
                      getPasswordStrengthColor(passwordStrength)
                    } ${getPasswordStrengthWidth(passwordStrength)}`}></div>
                  </div>
                  
                  {/* Password Requirements */}
                  <div className="space-y-1">
                    {['At least 8 characters', 'One lowercase letter', 'One uppercase letter', 'One number', 'One special character'].map((requirement, index) => {
                      const isValid = passwordErrors.findIndex(error => 
                        error.includes(requirement.split(' ').slice(-2).join(' ').toLowerCase())
                      ) === -1
                      
                      return (
                        <div key={index} className="flex items-center space-x-2">
                          {isValid ? (
                            <Check className="h-3 w-3 text-green-500" />
                          ) : (
                            <X className="h-3 w-3 text-gray-400" />
                          )}
                          <span className={`text-xs ${
                            isValid ? 'text-green-600' : 'text-gray-500'
                          }`}>
                            {requirement}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
              
              {errors.password && (
                <p className="text-sm text-red-600 flex items-center space-x-1">
                  <AlertCircle className="h-4 w-4" />
                  <span>{errors.password.message}</span>
                </p>
              )}
            </div>

            {/* Confirm Password Field */}
            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700">
                Confirm password
              </Label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className={`h-5 w-5 ${hasConfirmPasswordValue ? 'text-primary' : 'text-gray-400'} transition-colors`} />
                </div>
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  {...register('confirmPassword')}
                  disabled={loading || isSubmitting}
                  placeholder="Confirm your password"
                  className={`pl-10 pr-10 transition-all duration-200 ${
                    errors.confirmPassword 
                      ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
                      : hasConfirmPasswordValue 
                      ? passwordsMatch
                        ? 'border-green-300 focus:border-green-500 focus:ring-green-500'
                        : 'border-red-300 focus:border-red-500 focus:ring-red-500'
                      : 'focus:border-primary focus:ring-primary/20'
                  }`}
                />
                <button
                  type="button"
                  onClick={toggleConfirmPasswordVisibility}
                  disabled={loading || isSubmitting}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
              
              {hasConfirmPasswordValue && passwordsMatch && (
                <p className="text-sm text-green-600 flex items-center space-x-1">
                  <Check className="h-4 w-4" />
                  <span>Passwords match</span>
                </p>
              )}
              
              {errors.confirmPassword && (
                <p className="text-sm text-red-600 flex items-center space-x-1">
                  <AlertCircle className="h-4 w-4" />
                  <span>{errors.confirmPassword.message}</span>
                </p>
              )}
            </div>

            {/* Terms Agreement */}
            <div className="space-y-2">
              <div className="flex items-start">
                <input
                  id="agreeToTerms"
                  type="checkbox"
                  {...register('agreeToTerms')}
                  disabled={loading || isSubmitting}
                  className="h-4 w-4 text-primary focus:ring-primary/20 border-gray-300 rounded transition-colors mt-0.5"
                />
                <Label htmlFor="agreeToTerms" className="ml-2 text-sm text-gray-700 cursor-pointer leading-5">
                  I agree to the{' '}
                  <a href="/terms" className="font-medium text-primary hover:text-primary/80 transition-colors">
                    Terms of Service
                  </a>{' '}
                  and{' '}
                  <a href="/privacy" className="font-medium text-primary hover:text-primary/80 transition-colors">
                    Privacy Policy
                  </a>
                </Label>
              </div>
              {errors.agreeToTerms && (
                <p className="text-sm text-red-600 flex items-center space-x-1">
                  <AlertCircle className="h-4 w-4" />
                  <span>{errors.agreeToTerms.message}</span>
                </p>
              )}
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={loading || isSubmitting || !isValid}
              className="w-full py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              {loading || isSubmitting ? (
                <div className="flex items-center justify-center space-x-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Creating account...</span>
                </div>
              ) : (
                'Create account'
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
