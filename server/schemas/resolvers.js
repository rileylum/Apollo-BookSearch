const { AuthenticationError } = require('apollo-server-express');
const { User, Book } = require('../models');
const {signToken} = require('../utils/auth');

const resolvers = {
    Query: {
        user: async(_, {username}) => {
            return User.findOne({username}).populate('savedBooks')
        },

        me: async(_, __, context) => {
            console.log(context.user);
            if (context.user) {
                return User.findOne({_id: context.user._id}).populate('savedBooks')
            }
        }
    },

    Mutation: {
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

        addUser: async(_, {username, email, password}) => {
            const user = await User.create({username, email, password});

            if(!user) {
                throw new AuthenticationError("Something went wrong! Try again.")
            }
            const token = signToken(user);
            return {token, user};
        },

        saveBook: async(_, {book: body}, context) => {
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