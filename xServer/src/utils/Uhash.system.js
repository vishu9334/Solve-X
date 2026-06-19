import bcrypt from 'bcrypt';

const hashingMethod = async(value, rounds = 10)=> {
        const hashing = await bcrypt.hash(value, Number(rounds))
        return hashing
}

const compaireMethod = async(plainValue, hashValue)=>{
    const isMatch = await bcrypt.compare(plainValue,hashValue);
    return isMatch
}

export {hashingMethod, compaireMethod};