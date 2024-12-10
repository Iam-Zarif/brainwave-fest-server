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

const getDiscussionCollection = async () => {
  const discussionCollection = await getCollection("posts", "discussions");
  logCollectionExistence("Discussion", discussionCollection);
  return discussionCollection;
};

const getProjectCollection = async () => {
  const projectCollection = await getCollection("posts", "projects");
  logCollectionExistence("Project", projectCollection);
  return projectCollection;
};

module.exports = {
  getStudentCollection,
  getFacultyCollection,
  getStudentFeedbackCollection,
  getDiscussionCollection,
  getProjectCollection,
};
