# Teacher API Endpoints

## Course Student Performance

### Get Detailed Course Student Performance

This endpoint provides comprehensive data about all students in a course, including enrollment information, quiz performance, and overall course participation metrics.

**URL**: `/api/teachers/course/:courseId/student-performance`

**Method**: `GET`

**Authentication**: Required (teacher must own the course)

**URL Parameters**:

- `courseId`: The ID of the course to get student performance data for

**Success Response**:

- **Code**: 200
- **Content**:

```json
{
  "message": "Detailed course student performance retrieved successfully",
  "data": {
    "courseId": "course-123",
    "title": "Introduction to Programming",
    "enrollmentCount": 25,
    "studentsWithQuizzesCount": 18,
    "quizCompletionRate": 72,
    "activeStudentsCount": 20,
    "courseActivityRate": 80,
    "students": [
      {
        "userId": "user-123",
        "fullName": "John Doe",
        "email": "john@example.com",
        "enrollmentDate": "2023-05-15T10:30:00Z",
        "lastAccessDate": "2023-06-10T14:20:00Z",

        "overallProgress": 75,
        "totalMaterialAccessCount": 42,
        "participationLevel": "High",
        "completedChaptersCount": 8,

        "hasCompletedQuizzes": true,
        "completedQuizzes": [
          {
            "quizId": "quiz-123",
            "title": "Variables and Data Types",
            "score": 8,
            "totalQuestions": 10,
            "completionDate": "2023-05-20T09:15:00Z",
            "attemptCount": 1,
            "scorePercentage": 80
          }
        ],
        "averageQuizScore": 80,
        "totalQuizzesCompleted": 1,

        "discussionActivity": [
          {
            "discussionId": "disc-123",
            "postsCount": 5,
            "lastActivityDate": "2023-06-01T16:30:00Z"
          }
        ],
        "totalDiscussionPosts": 5
      }
    ]
  }
}
```

**Error Responses**:

1. Unauthorized

   - **Code**: 401
   - **Content**: `{ "message": "Unauthorized" }`

2. Course Not Found

   - **Code**: 404
   - **Content**: `{ "message": "Course not found" }`

3. Permission Denied

   - **Code**: 403
   - **Content**: `{ "message": "You do not have permission to access this course's data" }`

4. Server Error
   - **Code**: 500
   - **Content**: `{ "message": "Error retrieving detailed course student performance", "error": "Error details" }`

### Explanation of Response Fields

#### Course Summary

- `courseId`: Unique identifier of the course
- `title`: Course title
- `enrollmentCount`: Total number of students enrolled
- `studentsWithQuizzesCount`: Number of students who have completed at least one quiz
- `quizCompletionRate`: Percentage of enrolled students who have completed quizzes
- `activeStudentsCount`: Number of students who have accessed the course in the last 30 days
- `courseActivityRate`: Percentage of enrolled students who are active

#### Student Information

- `userId`: Unique identifier of the student
- `fullName`: Student's full name
- `email`: Student's email address
- `enrollmentDate`: When the student enrolled in the course
- `lastAccessDate`: When the student last accessed the course

#### Participation Metrics

- `overallProgress`: Overall course completion percentage
- `totalMaterialAccessCount`: How many times the student accessed course materials
- `participationLevel`: Qualitative assessment of student's participation (None, Low, Medium, High)
- `completedChaptersCount`: Number of chapters completed by the student

#### Quiz Performance

- `hasCompletedQuizzes`: Whether the student has completed any quizzes
- `completedQuizzes`: Array of quizzes the student has completed
  - `quizId`: Unique identifier of the quiz
  - `title`: Quiz title
  - `score`: Number of correct answers
  - `totalQuestions`: Total number of questions in the quiz
  - `completionDate`: When the student completed the quiz
  - `attemptCount`: How many times the student attempted the quiz
  - `scorePercentage`: Score as a percentage
- `averageQuizScore`: Student's average quiz score as a percentage
- `totalQuizzesCompleted`: Number of quizzes completed by the student

#### Discussion Activity

- `discussionActivity`: Array of the student's discussion forum activities
  - `discussionId`: Unique identifier of the discussion thread
  - `postsCount`: Number of posts the student made in this thread
  - `lastActivityDate`: When the student last posted in this thread
- `totalDiscussionPosts`: Total number of posts across all discussion threads

## Related Endpoints

The following endpoints provide specific subsets of the student performance data:

1. **Get Course Enrollment Count**: `/api/teachers/course/:courseId/enrollment-count`
2. **Get Course Enrollment Details**: `/api/teachers/course/:courseId/enrollment-details`
3. **Get Course Quiz Completion Count**: `/api/teachers/course/:courseId/quiz-completion-count`
4. **Get Students With Quiz Completions**: `/api/teachers/course/:courseId/students-with-quiz-completions`
