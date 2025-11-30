import React, { useState } from 'react';
import { Question } from '../types';

interface QuestionCardProps {
    question: Question;
    index: number;
}

const QuestionCard: React.FC<QuestionCardProps> = ({ question, index }) => {
    const [selectedOption, setSelectedOption] = useState<string | null>(null);
    const [showExplanation, setShowExplanation] = useState(false);

    const handleSelect = (option: string) => {
        if (selectedOption) return; // Prevent changing answer
        setSelectedOption(option);
        setShowExplanation(true);
    };

    const getOptionClass = (option: string) => {
        if (!selectedOption) return 'hover:bg-indigo-50 border-gray-200';

        if (option === question.correctAnswer) {
            return 'bg-green-100 border-green-500 text-green-800';
        }

        if (option === selectedOption && option !== question.correctAnswer) {
            return 'bg-red-100 border-red-500 text-red-800';
        }

        return 'opacity-50 border-gray-200';
    };

    return (
        <div className="bg-white rounded-xl shadow-md p-6 mb-6 border border-gray-100">
            <div className="flex items-start gap-4 mb-4">
                <span className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-indigo-100 text-indigo-600 font-bold rounded-full">
                    {index + 1}
                </span>
                <h3 className="text-lg font-semibold text-gray-800 pt-1">{question.text}</h3>
            </div>

            <div className="space-y-3 ml-12">
                {question.options.map((option, idx) => (
                    <button
                        key={idx}
                        onClick={() => handleSelect(option)}
                        disabled={!!selectedOption}
                        className={`w-full text-left p-4 rounded-lg border-2 transition-all ${getOptionClass(option)}`}
                    >
                        {option}
                    </button>
                ))}
            </div>

            {showExplanation && (
                <div className="mt-6 ml-12 p-4 bg-blue-50 rounded-lg border border-blue-100 text-blue-800 animate-fadeIn">
                    <p className="font-semibold mb-1">Explanation:</p>
                    <p>{question.explanation}</p>
                </div>
            )}
        </div>
    );
};

export default QuestionCard;
