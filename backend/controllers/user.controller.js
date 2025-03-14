export const signout = async (req,res,next) => {
    try {
        res.clearCookie('access_token')
        res.status(200).json({message:'Signout successfully'})
    } catch (error) {
        next(error)
    }
}

export const deleteUser = async (req,res,next) => {
    try {
        
    } catch (error) {
        next(error)
    }
}