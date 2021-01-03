;(function(w,d){
    function makeBatch(event){
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
        
        const form = event.currentTarget;

        let buttons = form.querySelectorAll('button[type="submit"]');
        buttons.forEach(function(button) {
            button.setAttribute('disabled', 'disabled');
        });

        let url = form.action;

        try {
            let formData = new FormData(form);

            url = url + formData.get('batchId');

            //- I have to collect all the selected values before passing it
            
            imageSelectOptions = Array(...form['batchImageSelect'].options).reduce((acc, option) => {
                if (option.selected === true) {
                    acc.push(option.value);
                }
                return acc;
            }, []);
            formData.set('batchImageSelect', imageSelectOptions);

            imageTransforms = Array(...form['colorCorrections']).reduce((acc, option) => {
                if (option.checked === true) {
                    acc.push(option.value);
                }
                return acc;
            }, []);
            formData.set('colorCorrections', imageTransforms);

            let plainFormData = Object.fromEntries(formData.entries()),
                formDataJsonString = JSON.stringify(plainFormData),
                fetchOptions = {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Accept: "application/json",
                    },
                    body: formDataJsonString,
                };

            fetch(url, fetchOptions).then(res => {
                return res.json();
            }).then( data => {
                //- This is where we make the table
                // {"name":"somename","job":"1609656096105","ops":["rotate","flip","resize","scale","colorize","color-correction","color-correction"]}
                console.log(data);
                // could set up SSE here, but doesn't seem to be what we need without more complication :/
            }).catch(function(e) {
                console.log('Error', e);
            });

        } catch (error) {
            console.error(error);
        }

    };

    let form = d.querySelector('#batch-form');
    form.addEventListener('submit', makeBatch);

})(window,document)