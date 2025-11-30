export interface ExamRequest {
  topic: string;
  numberOfQuestions: number;
  difficulty: 'Easy' | 'Medium' | 'Hard';
}

export interface Question {
  id: number;
  text: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
}

export interface Exam {
  id: string;
  topic: string;
  createdAt: string;
  questions: Question[];
}
