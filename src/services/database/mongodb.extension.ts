import {safeObjectID} from './database.service'

export const get = async (_, instance, query) => {
    return (Object.values(query[0])[0] !== undefined) 
        ? await instance.findOne({$or: query}) //encryption references
        : await instance.find({}).toArray(); //encryption references     
}

export const del = async (_, instance, o ) => {
    await instance.deleteOne({ id: o.id });
}

export const post = async (_, instance, args) => {
    await Promise.all(args.map(async struct => {
        let copy = JSON.parse(JSON.stringify(struct)); // Deep Copy
        if(copy._id) delete copy._id;                                
        // Only Set _id if Appropriate
        const _id = safeObjectID(struct._id)
        const toFind = (_id !== struct._id) ? { _id } : {id: struct.id}
        await instance.updateOne(toFind, {$set: copy}, {upsert: true});   

        // TODO: Add subscriptions rather than checkToNotify                              
        // this.checkToNotify(user, [struct]);

        return true;
    }))
}