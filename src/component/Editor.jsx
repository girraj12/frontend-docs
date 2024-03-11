import { useEffect, useState } from 'react';
import Quill from 'quill';
import 'quill/dist/quill.snow.css';
import { Box } from '@mui/material';
import styled from '@emotion/styled';
import { io } from 'socket.io-client';
import { useParams } from 'react-router-dom';

const Component = styled.div`
    background: #F5F5F5;
`;

const toolbarOptions = [
    ['bold', 'italic', 'underline', 'strike'],
    ['blockquote', 'code-block'],
    [{ 'header': 1 }, { 'header': 2 }],
    [{ 'list': 'ordered'}, { 'list': 'bullet' }],
    [{ 'script': 'sub'}, { 'script': 'super' }],
    [{ 'indent': '-1'}, { 'indent': '+1' }],
    [{ 'direction': 'rtl' }],
    [{ 'size': ['small', false, 'large', 'huge'] }],
    [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
    [{ 'color': [] }, { 'background': [] }],
    [{ 'font': [] }],
    [{ 'align': [] }],
    ['clean']
];

const Editor = () => {
    const [socket, setSocket] = useState(null);
    const [quill, setQuill] = useState(null);
    const { id } = useParams();

    useEffect(() => {
        const container = document.getElementById('container');
        if (!container) return;

        const quillServer = new Quill(container, { theme: 'snow', modules: { toolbar: toolbarOptions } });
        quillServer.disable();
        quillServer.setText('Loading the document...');
        setQuill(quillServer);
    }, []);

    useEffect(() => {
        const socketServer = io('https://backend-docs-eta.vercel.app/');

        socketServer.on('connect', () => {
            console.log('Socket connected successfully');
        });

        socketServer.on('connect_error', (error) => {
            console.error('Socket connection error:', error);
        });

        setSocket(socketServer);

        return () => {
            socketServer.disconnect();
        };
    }, []);

    useEffect(() => {
        if (!quill || !socket) return;

        const handleChange = (delta, oldData, source) => {
            if (source !== 'user') return;
            console.log('Text changed:', delta);
            socket.emit('send-changes', delta);
        };

        quill.on('text-change', handleChange);

        return () => {
            quill.off('text-change', handleChange);
        };
    }, [quill, socket]);

    useEffect(() => {
        if (!quill || !socket) return;

        const handleChange = (delta) => {
            console.log('Received changes:', delta);
            quill.updateContents(delta);
        };

        socket.on('receive-changes', handleChange);

        return () => {
            socket.off('receive-changes', handleChange);
        };
    }, [quill, socket]);

    useEffect(() => {
        if (!quill || !socket) return;

        socket.once('load-document', (document) => {
            console.log('Loading document:', document);
            quill.setContents(document);
            quill.enable();
        });

        socket.emit('get-document', id);
    }, [quill, socket, id]);

    useEffect(() => {
        if (!quill || !socket) return;

        const interval = setInterval(() => {
            socket.emit('save-document', quill.getContents());
        }, 2000);

        return () => {
            clearInterval(interval);
        };
    }, [quill, socket]);

    return (
        <Component>
            <Box className='container' id='container' />
        </Component>
    );
};

export default Editor;
