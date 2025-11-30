import React, { useState } from 'react';
import { ExamRequest } from '../types';

interface TopicFormProps {
    onSubmit: (request: ExamRequest) => void;
    isLoading: boolean;
}

const TopicForm: React.FC<TopicFormProps> = ({ onSubmit, isLoading }) => {
    const [topic, setTopic] = useState('');
    const [difficulty, setDifficulty] = useState<'Easy' | 'Medium' | 'Hard'>('Medium');
    const [numberOfQuestions, setNumberOfQuestions] = useState(5);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit({ topic, difficulty, numberOfQuestions });
    };

    return (
        <div className="w-full max-w-md p-8 bg-white rounded-2xl shadow-xl border border-gray-100">
            <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center">Create Your Exam</h2>
            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <label htmlFor="topic" className="block text-sm font-medium text-gray-700 mb-2">
                        Topic
                    </label>
                    <input
                        id="topic"
                        type="text"
                        value={topic}
                        onChange={(e) => setTopic(e.target.value)}
                        placeholder="e.g., World History, React Hooks..."
                        className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none"
                        required
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="difficulty" className="block text-sm font-medium text-gray-700 mb-2">
                            Difficulty
                        </label>
                        <select
                            id="difficulty"
                            value={difficulty}
                            onChange={(e) => setDifficulty(e.target.value as any)}
                            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                        >
                            <option value="Easy">Easy</option>
                            <option value="Medium">Medium</option>
                            <option value="Hard">Hard</option>
                        </select>
                    </div>
                    <div>
                        <label htmlFor="count" className="block text-sm font-medium text-gray-700 mb-2">
                            Questions
                        </label>
                        <input
                            id="count"
                            type="number"
                            min="1"
                            max="20"
                            value={numberOfQuestions}
                            onChange={(e) => setNumberOfQuestions(parseInt(e.target.value))}
                            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 outline-none"
                        />
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={isLoading}
                    className={`w-full py-4 rounded-xl text-white font-semibold text-lg shadow-lg transition-all transform hover:scale-[1.02] active:scale-[0.98] ${isLoading
                            ? 'bg-gray-400 cursor-not-allowed'
                            : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700'
                        }`}
                >
                    {isLoading ? (
                        <span className="flex items-center justify-center">
                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Generating...
                        </span>
                    ) : (
                        'Generate Exam'
                    )}
                </button>
            </form>
        </div>
    );
};

export default TopicForm;
