'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSessionStore } from '@/lib/stores/session-store';

export default function FeedbackPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const router = useRouter();
  const { sessionToken, isValid } = useSessionStore();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isValid()) {
    router.push('/');
    return null;
  }

  const handleSubmit = async () => {
    if (rating === 0) return;
    setIsSubmitting(true);

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';
      const response = await fetch(`${API_URL}/customer/feedback/${orderId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Session-Token': sessionToken!,
        },
        body: JSON.stringify({ rating, comment: comment || undefined }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error?.message || 'Failed to submit feedback');
      }

      setSubmitted(true);
    } catch (error: any) {
      alert(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-4">
        <div className="text-5xl">🙏</div>
        <h1 className="mt-4 text-xl font-bold">Thank you!</h1>
        <p className="mt-2 text-center text-sm text-muted-foreground">
          Your feedback helps us serve you better.
        </p>
        <button
          onClick={() => router.push('/menu')}
          className="mt-6 rounded-md bg-primary px-6 py-2 text-sm font-medium text-primary-foreground"
        >
          Back to Menu
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4">
      <h1 className="text-xl font-bold">How was your experience?</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Rate your order and help us improve
      </p>

      {/* Star rating */}
      <div className="mt-8 flex justify-center gap-2">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            onClick={() => setRating(star)}
            className="text-4xl transition-transform hover:scale-110"
          >
            {star <= rating ? '⭐' : '☆'}
          </button>
        ))}
      </div>
      <p className="mt-2 text-center text-sm text-muted-foreground">
        {rating === 0 && 'Tap to rate'}
        {rating === 1 && 'Poor'}
        {rating === 2 && 'Below average'}
        {rating === 3 && 'Average'}
        {rating === 4 && 'Good'}
        {rating === 5 && 'Excellent!'}
      </p>

      {/* Comment */}
      <div className="mt-8">
        <label className="block text-sm font-medium">Comments (optional)</label>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Tell us more about your experience..."
          className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          rows={4}
          maxLength={500}
        />
      </div>

      <button
        onClick={handleSubmit}
        disabled={rating === 0 || isSubmitting}
        className="mt-6 w-full rounded-md bg-primary py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
      >
        {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
      </button>

      <button
        onClick={() => router.push('/menu')}
        className="mt-3 w-full py-2 text-sm text-muted-foreground"
      >
        Skip
      </button>
    </div>
  );
}
