'use client';

import { useState } from 'react';
import TopicForm from '@/components/TopicForm';
import QuestionCard from '@/components/QuestionCard';
import { Exam, ExamRequest } from '@/types';
import { generateExam } from '@/services/api';

export default function Home() {
    const [exam, setExam] = useState<Exam | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleGenerate = async (request: ExamRequest) => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await generateExam(request);
            setExam(data);
        } catch (err) {
            setError('Failed to generate exam. Please try again.');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleReset = () => {
        setExam(null);
        setError(null);
    };

    return (
        <main className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 mb-4">
                        ExamAI
                    </h1>
                    <p className="text-lg text-gray-600">
                        Generate unlimited practice exams on any topic instantly.
                    </p>
                </div>

                {error && (
                    <div className="mb-8 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded shadow-sm">
                        <p>{error}</p>
                    </div>
                )}

                {!exam ? (
                    <div className="flex justify-center">
                        <TopicForm onSubmit={handleGenerate} isLoading={isLoading} />
                    </div>
                ) : (
                    <div className="animate-fadeIn">
                        <div className="flex justify-between items-center mb-8">
                            <h2 className="text-2xl font-bold text-gray-800">
                                {exam.topic} Exam
                            </h2>
                            <button
                                onClick={handleReset}
                                className="px-4 py-2 text-sm font-medium text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors"
                            >
                                Create New Exam
                            </button>
                        </div>

                        <div className="space-y-6">
                            {exam.questions.map((q, idx) => (
                                <QuestionCard key={q.id} question={q} index={idx} />
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </main>
    );
}
