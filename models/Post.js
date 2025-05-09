const mongoose = require('mongoose')
const AutoIncrement = require('mongoose-sequence')(mongoose)

const postSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    title: {
        type: String,
        required: true
    },
    text: {
        type: String,
        required: true
    },
},
{
    timestamps: true
})

postSchema.plugin(AutoIncrement, {
    inc_field: 'ticket',
    id: 'ticketNums',
    start_seq: 500
})
module.exports = mongoose.model('Post', postSchema)