'use client'

import { useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'

const contactSchema = z.object({
  name: z.string().trim().min(2, 'Enter your full name.'),
  email: z.string().trim().email('Enter a valid work email.'),
  company: z.string().trim().min(2, 'Enter your company name.'),
  useCase: z.string().trim().min(2, 'Tell us how you plan to use Fireblocks.'),
  message: z.string().trim().min(20, 'Add a bit more detail so the team can respond well.'),
})

type ContactValues = z.infer<typeof contactSchema>

const defaults: ContactValues = {
  name: '',
  email: '',
  company: '',
  useCase: '',
  message: '',
}

export function ContactForm() {
  const { toast } = useToast()
  const [submitting, setSubmitting] = useState(false)
  const form = useForm<ContactValues>({
    resolver: zodResolver(contactSchema),
    defaultValues: defaults,
  })

  async function onSubmit(values: ContactValues) {
    setSubmitting(true)

    try {
      const normalizedUseCase = values.useCase.toLowerCase()
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...values,
          useCase:
            normalizedUseCase.includes('custody')
              ? 'custody'
              : normalizedUseCase.includes('treasury')
                ? 'treasury'
                : normalizedUseCase.includes('compliance')
                  ? 'compliance'
                  : normalizedUseCase.includes('partner')
                    ? 'partnership'
                    : 'other',
        }),
      })

      const result = await response.json().catch(() => null)

      if (!response.ok) {
        throw new Error(result?.error ?? 'Unable to submit your request.')
      }

      toast({
        title: 'Request received',
        description: 'The Fireblocks team will contact you shortly.',
      })
      form.reset(defaults)
    } catch (error) {
      toast({
        title: 'Submission failed',
        description:
          error instanceof Error ? error.message : 'Please try again in a moment.',
        variant: 'destructive',
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-5">
        <div className="grid gap-5 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Full name</FormLabel>
                <FormControl>
                  <Input placeholder="Avery Morgan" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Work email</FormLabel>
                <FormControl>
                  <Input placeholder="avery@company.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="company"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Company</FormLabel>
                <FormControl>
                  <Input placeholder="Northbridge Capital" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="useCase"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Primary use case</FormLabel>
                <FormControl>
                  <Input placeholder="Custody, treasury, compliance..." {...field} />
                </FormControl>
                <FormDescription>
                  Mention the workflow you want Fireblocks to improve first.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="message"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tell us about your workflow</FormLabel>
              <FormControl>
                <Textarea
                  rows={6}
                  placeholder="Describe your current operating model, control requirements, and what you want to improve."
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" size="lg" className="rounded-full px-6" disabled={submitting}>
          {submitting ? 'Submitting...' : 'Send request'}
        </Button>
      </form>
    </Form>
  )
}
