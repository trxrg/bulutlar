import { useState } from 'react';

import './App.css';
import { addArticle, updateArticle } from './backend-adapter/BackendAdapter';


function ArticleTest() {

    const [inputs, setInputs] = useState({});

    const handleChange = (event) => {
        const name = event.target.name;
        const value = event.target.value;
        setInputs(values => ({ ...values, [name]: value }))
    }

    const handleSubmit1 = async (event) => {

        event.preventDefault();
        try {
            const result = await addArticle({
                title: inputs.articleTitleToAdd,
                order: 1,
                date: Date(),
                number: 2,
                explanation: "explanation 1",
                text: "text 1",
                comment: "comment 1",
                ownerId: 2
            });
            console.log(result);
        } catch (err) {
            console.error(err.message);
        }
    }

    const handleSubmit2 = async (event) => {

        event.preventDefault();
        try {
            const result = await updateArticle(inputs.articleId, {
                title: inputs.articleTitle
            });
            console.log(result);
        } catch (err) {
            console.error(err.message);
        }
    }

    if (window.process) {
        window.process.on('uncaughtException', function (error) {
            const { app, dialog } = window.require("electron").remote;
            console.log('error');
            dialog.showMessageBoxSync({ type: 'error', message: "Unexpected error occurred. Restarting the application.", title: "Erroradfafasdfa" });
            // app.relaunch();
            // app.quit();
        });
    }

    return (
        <div className="App">
            <h2>Article Test</h2>
            <form onSubmit={handleSubmit1}>
                <h2>Add Article</h2>
                <label>Enter title for article:
                    <input type='text' name='articleTitleToAdd' value={inputs.articleTitleToAdd || ""} onChange={handleChange} />
                </label>
                <input type="submit" />
            </form>
            <form onSubmit={handleSubmit2}>
                <h2>Update Article</h2>
                <label>Enter id of the article:
                    <input type='text' name='articleId' value={inputs.articleId || ""} onChange={handleChange} />
                </label>
                <label>Enter title for article:
                    <input type='text' name='articleTitle' value={inputs.articleTitle || ""} onChange={handleChange} />
                </label>
                <input type="submit" />
            </form>
        </div>
    );
}

export default ArticleTest;