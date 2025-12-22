import { createSlice } from '@reduxjs/toolkit'

const initialState = {
    cursors: []
}

const cursorSlice = createSlice({
    name: "cursor",
    initialState,
    reducers: {
        updateCursorPosition: (state, action) => {
            const {x, y, userId, username} = action.payload
            const index = state.cursors.findIndex((cursor)=> cursor.userId === userId)
            if(index !== -1){
                state.cursors[index] = {
                    userId,
                    username,
                    x,
                    y
                }
            } else {
                state.cursors.push({
                    userId,
                    username,
                    x, 
                    y
                })
            }
        },
        removeCursorPosition: (state, action) => {
            state.cursors = state.cursors.filter(c => c.userId !== action.payload)
        }
    }
})

export const {updateCursorPosition, removeCursorPosition} = cursorSlice.actions
export default cursorSlice.reducer;