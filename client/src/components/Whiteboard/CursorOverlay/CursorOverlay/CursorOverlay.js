import React from 'react'
import { useSelector } from 'react-redux';
import cursor from './../../resources/icons/selection.svg';

const CursorOverlay = () => {
  const cursors = useSelector((state) => state.cursor.cursors)

  return <>
    {cursors.map((c) => (
      <div key={c.userId}>
        <p style={{
          position: 'absolute',
          left: c.x - 30,
          top: c.y - 30,
        }}>{c.username}</p>

        <img style={{
          position: 'absolute',
          left: c.x,
          top: c.y,
          width: '30px'
        }} className='cursor' src={cursor} alt='cursor' />
      </div>
    ))}
  </>
}

export default CursorOverlay;