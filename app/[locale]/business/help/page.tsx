/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 */

import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  BookOpenIcon,
  HelpCircleIcon,
  MailIcon,
  MessageSquareIcon,
  VideoIcon,
} from 'lucide-react';

interface HelpPageProps {
  params: {
    locale: string;
  };
}

export default async function HelpPage({ params }: HelpPageProps): Promise<JSX.Element> {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect(`/${params.locale}/auth/login?callbackUrl=/${params.locale}/business/help`);
  }

  const faqs = [
    {
      question: 'How do I confirm a booking?',
      answer:
        'Navigate to the Bookings page, find the pending booking, and click the "Confirm" button. The customer will automatically receive a confirmation email.',
    },
    {
      question: 'Can I edit my studio information?',
      answer:
        'Yes! Go to Settings > Profile to update your studio name, description, contact details, and opening hours.',
    },
    {
      question: 'How do I add new services?',
      answer:
        'Navigate to Settings > Services and click "Add Service". Fill in the service details including name, description, price, and duration.',
    },
    {
      question: 'What do the booking statuses mean?',
      answer:
        'Pending: Awaiting your confirmation. Confirmed: You have accepted the booking. Cancelled: The booking was cancelled by you or the customer.',
    },
    {
      question: 'How can I view my schedule?',
      answer:
        'Use the Calendar page to view your bookings in a day, week, or month view. You can navigate between different time periods using the toolbar.',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-neutral-900">Help & Support</h1>
        <p className="text-muted-foreground mt-1">
          Get help with using the Massava business portal
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="cursor-pointer transition-shadow hover:shadow-md">
          <CardHeader>
            <BookOpenIcon className="h-8 w-8 text-neutral-700 mb-2" />
            <CardTitle className="text-lg">Documentation</CardTitle>
            <CardDescription>Read our comprehensive guides</CardDescription>
          </CardHeader>
        </Card>

        <Card className="cursor-pointer transition-shadow hover:shadow-md">
          <CardHeader>
            <VideoIcon className="h-8 w-8 text-neutral-700 mb-2" />
            <CardTitle className="text-lg">Video Tutorials</CardTitle>
            <CardDescription>Watch step-by-step tutorials</CardDescription>
          </CardHeader>
        </Card>

        <Card className="cursor-pointer transition-shadow hover:shadow-md">
          <CardHeader>
            <MessageSquareIcon className="h-8 w-8 text-neutral-700 mb-2" />
            <CardTitle className="text-lg">Contact Support</CardTitle>
            <CardDescription>Get help from our team</CardDescription>
          </CardHeader>
        </Card>
      </div>

      {/* FAQs */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <HelpCircleIcon className="h-5 w-5 text-neutral-700" />
            <CardTitle>Frequently Asked Questions</CardTitle>
          </div>
          <CardDescription>Find answers to common questions</CardDescription>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, index) => (
              <AccordionItem key={index} value={`item-${index}`}>
                <AccordionTrigger className="text-left">{faq.question}</AccordionTrigger>
                <AccordionContent className="text-muted-foreground">{faq.answer}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
      </Card>

      {/* Contact Support */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <MailIcon className="h-5 w-5 text-neutral-700" />
            <CardTitle>Still need help?</CardTitle>
          </div>
          <CardDescription>Our support team is here to help</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Can't find what you're looking for? Send us a message and we'll get back to you as soon
            as possible.
          </p>
          <Button>
            <MailIcon className="mr-2 h-4 w-4" />
            Contact Support
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
