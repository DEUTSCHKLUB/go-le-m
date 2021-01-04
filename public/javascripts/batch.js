;(function(w,d){

    function pollJob(jid, output){
        const jobProgWrap = output;
        const source = new EventSource(`/status/${jid}`);

        source.addEventListener('message', message => {
            if(message.data == "Complete"){
                source.close();
                jobProgWrap.innerHTML = `<a class="btn" href="/jobs/${jid}/output/output.tar.gz">Get Prints!</a>`;
            }
            jobProgWrap.innerHTML = message.data;
        });
    }
    
    function setPrintOrderTable(name, jobid, ops){
        let row = table.insertRow();
        // add name cell
        let nameCell = row.insertCell();
        nameCell.appendChild(d.createTextNode(`${name}`));
        // add transforms cell
        let filteredOps = ops.filter(function(item, pos){
            return ops.indexOf(item)== pos; 
        });
        let opsCell = row.insertCell();
        for (let element of filteredOps) {
            let s = d.createElement('span');
            s.className = (`op-icon ${element}`);
            opsCell.appendChild(s);
        }
        // add button
        let linkCell = row.insertCell();
        let progWrap = d.createElement('div');
        progWrap.className = `prog-${jobid}`;
        progWrap.appendChild(d.createTextNode(`Processing Prints...`));
        linkCell.appendChild(progWrap);
        pollJob(jobid,progWrap);
    }

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
                try{
                    let {name, jobid, ops} = JSON.parse(data);
                    setPrintOrderTable(name, jobid, ops);
                }catch(err){
                    console.log(err);
                }
            }).catch(function(e) {
                console.log('Error', e);
            });

        } catch (error) {
            console.error(error);
        }

    };

    const form = d.querySelector('#batch-form');
        table = d.querySelector('#batch-job-table');

    form.addEventListener('submit', makeBatch);

})(window,document)