const { AuthenticationError } = require('apollo-server-express');
const { User } = require('../models');
const {signToken} = require('../utils/auth');

const resolvers = {
    // QUERIES
    Query: {
        // GET A SPECIFIC USER BY USERNAME
        user: async(_, {username}) => {
            return User.findOne({username}).populate('savedBooks')
        },
        // GET THE CURRENTLY LOGGED IN USER FROM TOKEN STORED IN CONTEXT (provided by authMiddleware)
        me: async(_, __, context) => {
            console.log(context.user);
            if (context.user) {
                return User.findOne({_id: context.user._id}).populate('savedBooks')
            }
        }
    },
    // MUTATIONS
    Mutation: {
        // GET THE REQUESTED USER AND PERFORM AUTH TO CONFIRM DETAILS
        // CREATE TOKEN FOR AUTH
        login: async(_, {email, password}) => {
            const user = await User.findOne({email});

            if(!user) {
                throw new AuthenticationError("Incorrect credentials")
            }

            const correctPw = await user.isCorrectPassword(password);

            if(!correctPw) {
                throw new AuthenticationError("Incorrect credentials")
            }

            const token = signToken(user);

            return {token, user};
        },
        // CREATE NEW USER
        // CREATE TOKEN FOR AUTH
        addUser: async(_, {username, email, password}) => {
            const user = await User.create({username, email, password});

            if(!user) {
                throw new AuthenticationError("Something went wrong! Try again.")
            }
            const token = signToken(user);
            return {token, user};
        },
        // ADD BOOK TO USERS SAVEDBOOKS LIST
        saveBook: async(_, {book}, context) => {
            try {
                const user = await User.findOneAndUpdate(
                    {_id: context.user._id},
                    {$addToSet: {savedBooks: book}},
                    {new: true, runValidatiors: true}
                );
                return user;
            } catch (err) {
                console.log(err);
                throw new AuthenticationError("An unexpected error occured")
            }
        },
        // REMOVE BOOK FROM USERS SAVEDBOOKS LIST
        removeBook: async(_, {bookId}, context) => {
            try {
                const user = await User.findOneAndUpdate(
                    {_id: context.user._id},
                    {$pull: {savedBooks: {bookId}}},
                    {new: true}
                );
                return user;
            } catch (err) {
                console.log(err);
                throw new AuthenticationError("An unexpected error occured")
            }
        }
        
    }
};

module.exports = resolvers;