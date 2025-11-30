import { Exam, ExamRequest } from '../types';

const API_BASE_URL = `${process.env.NEXT_PUBLIC_API_URL}/api`;

export const generateExam = async (request: ExamRequest): Promise<Exam> => {
    const response = await fetch(`${API_BASE_URL}/exam/generate`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
    });

    if (!response.ok) {
        throw new Error('Failed to generate exam');
    }

    return response.json();
};
