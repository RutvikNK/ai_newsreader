import axios from "axios";

const API_URL = "http://0.0.0.0:8080/api/stories";
export const getNewsStories = async () => {
  const response = await axios.get(API_URL);
  return response.data;
};
