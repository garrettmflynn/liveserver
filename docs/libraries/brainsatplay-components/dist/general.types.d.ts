/// <reference types="react" />
export declare type Size = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export declare type DataState = 'done' | 'loading' | 'error';
export declare type ColorTypes = 'primary' | 'secondary' | 'warning' | 'danger' | 'success' | 'info';
export declare type ObjMap<S extends string, T = string> = {
    [K in S]: T;
};
export declare type AnyFct = () => any;
export declare type NavItem = {
    onClick: AnyFct;
    children: JSX.Element | string;
};
