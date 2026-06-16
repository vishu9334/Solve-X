import {useForm} from 'react-hook-form';
import  {zodResolver} from '@hookform/resolvers/zod';
import { loginZodValidation } from '../../validations/auth.schema';
import { useLogin } from '../hooks/useLogin.js'

const LoginPage = ()=>{
    const {mutate: login, isPending} = useLogin();
    const {register, handleSubmit, formState:{errors}}=useForm({
        resolver:zodResolver(loginZodValidation),
        mode:"onChange",
        reValidateMode: "onChange"
    })
    const onSubmit =(data)=>{
        login(data)
    }
    return (


        <form onSubmit={handleSubmit(onSubmit)}>
            <input {...register('email')} placeholder='Email' />
            {errors.email && <p>{errors.email.message}</p>}

            <input {...register('password')} placeholder='Password'/>
            {errors.password && <p>{errors.password.message}</p>}
            <button type='submit'>{isPending?'Loading...':'Login'}</button>
        </form>
    )
}
export default LoginPage