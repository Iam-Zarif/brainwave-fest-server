const { getCollection } = require("./db");

const logCollectionExistence = (collectionName, collection) => {
  if (collection) {
    console.log(`${collectionName} collection exists.`);
  } else {
    console.log(`${collectionName} collection does not exist.`);
  }
};

// Functions to get specific collections
const getStudentCollection = async () => {
  const studentCollection = await getCollection("profiles", "students");
  logCollectionExistence("Student", studentCollection);
  return studentCollection;
};

const getFacultyCollection = async () => {
  const teacherCollection = await getCollection("profiles", "faculties");
  logCollectionExistence("Faculty", teacherCollection);
  return teacherCollection;
};

const getStudentFeedbackCollection = async () => {
  const studentsFeedbackCollection = await getCollection(
    "feedbacks",
    "studentsFeedbacks"
  );
  logCollectionExistence("Feedback", studentsFeedbackCollection);
  return studentsFeedbackCollection;
};

const getCoursesCollection = async () => {
  const coursesCollection = await getCollection("courses", "universityCourses");
  logCollectionExistence("Courses", coursesCollection);
  return coursesCollection;
};
const getAttendanceCollection = async () => {
  const attendanceCollection = await getCollection("attendance", "studentAttendance");
  logCollectionExistence("Attendance", attendanceCollection);
  return attendanceCollection;
};


module.exports = {
  getStudentCollection,
  getFacultyCollection,
  getStudentFeedbackCollection,
  getCoursesCollection,
  getAttendanceCollection,
};
