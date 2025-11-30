namespace ExamAI.API.Models;
public class ExamRequest
{
    public string Topic { get; set; } = string.Empty;
    public int NumberOfQuestions { get; set; } = 10;
    public string Difficulty { get; set; } = "Medium"; // Easy, Medium, Hard
}

public class Question
{
    public int Id { get; set; }
    public string Text { get; set; } = string.Empty;
    public List<string> Options { get; set; } = new List<string>();
    public string CorrectAnswer { get; set; } = string.Empty;
    public string Explanation { get; set; } = string.Empty;
}

public class Exam
{
    public Guid Id { get; set; }
    public string Topic { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public List<Question> Questions { get; set; } = new List<Question>();
}
