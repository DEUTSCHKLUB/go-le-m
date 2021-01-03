;(function(w,d){

        // ADD FILES TO FORM (EXPECTS ARRAY)
        function makeImageSelects(filesList){
            const swrap = d.querySelector("select#batch-image-select"),
                  form = d.querySelector("#batch-form");
            swrap.innerHTML = "";

            let input = document.createElement("input");
            input.setAttribute("type", "hidden");
            input.setAttribute("name", "batchId");
            input.setAttribute("value", filesList.id);
            //append to form element that you want .
            form.appendChild(input);

            for ( let file of filesList.imgs.children ) {
                let o = document.createElement('option'),
                    prev = document.createElement('img');

                o.value = `${file.name}`;
                o.textContent = `${file.name}`;
                prev.src=`${file.path}`;
                prev.className = 'option-preview';
                o.setAttribute('selected','selected');
                o.prepend(prev);

                swrap.appendChild(o);
            }
        }

        // DRAG-N-DROP FUNCTIONALITY

        const dropArea = d.getElementById('file-upload-label');

        ;['dragenter', 'dragover'].forEach(eventName => {
            dropArea.addEventListener(eventName, highlight, false);
        })

        ;['dragleave', 'drop'].forEach(eventName => {
            dropArea.addEventListener(eventName, unhighlight, false);
        })

        function highlight(e) {
            dropArea.classList.add('highlight');
        }

        function unhighlight(e) {
            dropArea.classList.remove('highlight');
        }

        // FILE UPLOAD FUNCTIONALITY

        const fileInput = d.querySelector('#file-upload-field');
              prog = d.querySelector('#progress-img');

        fileInput.onchange = () => {
            prog.className = "";
            let files = [...fileInput.files],
                totalSize = 0;
            if (files.length > 0) {
                prog.classList.add('started');
                for (let j = 0; j < files.length; j++) {
                    totalSize += files[j].size;
                }
                if(totalSize <= 10485760){
                    let formData = new FormData();
                    for (let i = 0; i < files.length; i++) {
                        let file = files[i]
                        formData.append('uploads[]', file, file.name)
                    }
                    
                    fetch(`/upload/${Date.now()}`, {
                        method:'POST',
                        body:formData	
                    }).then(res => {
                        prog.classList.remove('started');
                        prog.classList.add('fin');
                        return res.json();
                    }).then( data => {
                        makeImageSelects(data);
                    }).catch(function(e) {
                        console.log('Error',e);
                    });
                }else{
                    prog.classList.remove('started');
                    prog.classList.add('error');
                }
            }
        };

    })(window, document)