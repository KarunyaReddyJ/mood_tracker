import React from 'react'

const MoodEntryDisplay = ({mood,time}) => {
  return (
    <div>
        <h3>mood : {mood}</h3>
        <h3>time : {time} </h3>
    </div>
  )
}

export default MoodEntryDisplay