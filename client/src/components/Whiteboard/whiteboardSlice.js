import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  tool: null,
  elements: [],
  activeUsers: [],
};

const whiteboardSlice = createSlice({
  name: "whiteboard",
  initialState,
  reducers: {
    setToolType: (state, action) => {
      state.tool = action.payload;
    },
    updateElement: (state, action) => {
      const { id } = action.payload;

      const index = state.elements.findIndex((element) => element.id === id);

      if (index === -1) {
        state.elements.push(action.payload);
      } else {
        state.elements[index] = action.payload;
      }
    },
    addActiveUserToBoard: (state, action) => {
      console.log(action.payload);
      const user = action.payload;
      const userId = user._id;

      const index = state.activeUsers.findIndex((user) => user._id === userId);
      if(index === -1){
        state.activeUsers.push(user);
      }else{
        state.activeUsers[index] = user;
      }
    },
    removeActiveUserFromBoard: (state, action) => {
      const user  = action.payload;
      const userId = user._id;
      state.activeUsers = state.activeUsers.filter((user) => user._id !== userId);
    },
    setElements: (state, action) => {
      state.elements = action.payload;
    },
  },
});

export const { setToolType, updateElement, setElements, addActiveUserToBoard, removeActiveUserFromBoard } =
  whiteboardSlice.actions;

export default whiteboardSlice.reducer;
