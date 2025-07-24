"use client"
import React from 'react'
import MoodForm from '../../components/Form'
import DataStore from '@/utils/DataStore'
import constants from '@/utils/constants'
const EntryForm = () => {
  
  const entrySaveCallback = async(entry) => {
    const store =new DataStore(constants.backend)
    const data =await store.get('entries','[]')
    const parsedData = JSON.parse(data) || []
    parsedData.push(entry)
    await store.set('entries', JSON.stringify(parsedData))
    console.log(entry,'added')
  }
  return (
    <div>
      <MoodForm onSubmit={entrySaveCallback} />
    </div>
  )
}

export default EntryForm