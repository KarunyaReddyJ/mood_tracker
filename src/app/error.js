import React from 'react'

const Error = ({ error }) => {
    return (
        <div>
            <p>Error Occured</p>
            <p>{error.message}</p>
        </div>
    )
}

export default Error