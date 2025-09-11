const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const drawLabelButton = (doc, x, y, text) => {
    const buttonWidth = 150;
    const buttonHeight = 30;
    const borderRadius = 15;
    const buttonColor = '#D95D69';

    doc.roundedRect(x, y, buttonWidth, buttonHeight, borderRadius).fill(buttonColor);
    doc.fillColor('white').font('Helvetica-Bold').fontSize(12)
       .text(text, x, y + 9, { width: buttonWidth, align: 'center' });
};

const generateAnnotatedImages = async (imageURLs, annotationsArr) => {
    const annotatedPaths = [];

    console.log("Annotations array passed:", annotationsArr);

    for (let i = 0; i < imageURLs.length; i++) {
        const imgPath = path.resolve(__dirname, '..', imageURLs[i].replace(/^\/+/, ''));
        const outputPath = path.join(__dirname, `annotated_${i}.png`);
        annotatedPaths.push(outputPath);

        console.log(`Processing image ${i}: ${imgPath}`);

        let image = sharp(imgPath);
        const metadata = await image.metadata();

        let svgRects = '';
        const imageAnnotations = annotationsArr[i]?.annotations || [];
        console.log(`Found ${imageAnnotations.length} annotations for image ${i}`);

        imageAnnotations.forEach((ann, idx) => {
            console.log(`Annotation ${idx}:`, ann);
            if (ann.type === 'rectangle') {
                let { x, y, width, height, color } = ann;
                if (width < 0) { x += width; width = Math.abs(width); }
                if (height < 0) { y += height; height = Math.abs(height); }

                svgRects += `<rect x="${x}" y="${y}" width="${width}" height="${height}" 
                             fill="none" stroke="${color}" stroke-width="2"/>`;
            }
        });

        if (svgRects === '') {
            console.warn(`No valid rectangles for image ${i}`);
            await image.toFile(outputPath);
        } else {
            const svg = `<svg width="${metadata.width}" height="${metadata.height}">${svgRects}</svg>`;

            await image
                .composite([{ input: Buffer.from(svg), blend: 'over' }])
                .toFile(outputPath);
        }

        console.log(`Annotated image saved at: ${outputPath}`);
    }
    return annotatedPaths;
};

const generateOralHealthReport = async (submission, outputPath) => {
    let imageURLsToUse = submission.imageURLs;
    if (submission.findings && submission.findings.annotations && 
        submission.findings.annotations.length > 0) {
        try {
            imageURLsToUse = await generateAnnotatedImages(
                submission.imageURLs, 
                submission.findings.annotations
            );
        } catch (error) {
            console.error("Error generating annotated images:", error);
            imageURLsToUse = submission.imageURLs;
        }
    }
    return new Promise((resolve, reject) => {
        const doc = new PDFDocument({ size: 'A4', margin: 40 });
        const writeStream = fs.createWriteStream(outputPath);
        doc.pipe(writeStream);

        doc.rect(0, 0, doc.page.width, doc.page.height).fill('#F3F0F7');
        doc.fillColor('#333333');

        const headerHeight = 80;
        doc.rect(0, 0, doc.page.width, headerHeight).fill('#946ad6'); 
        doc.fillColor('white');
        doc.font('Helvetica-Bold').fontSize(22).text('Oral Health Screening', 0, 20, { align: 'center' });
        doc.fontSize(18).text('Report', 0, 45, { align: 'center' });
        doc.fillColor('#333333');
        doc.y = headerHeight + 20;

        const infoY = doc.y;
        doc.fontSize(10).font('Helvetica');
        
        const nameText = `Name: ${submission.name}`;
        const phoneText = `Phone: ${submission.phone}`;
        const dateText = `Date: ${new Date(submission.createdAt || Date.now()).toLocaleDateString('en-GB')}`;

        // Name (left)
        doc.text(nameText, 40, infoY);

        // Phone (center)
        const phoneWidth = doc.widthOfString(phoneText);
        doc.text(phoneText, (doc.page.width - phoneWidth) / 2, infoY);

        // Date (right)
        const dateWidth = doc.widthOfString(dateText);
        doc.text(dateText, doc.page.width - 40 - dateWidth, infoY);

        doc.y = infoY + 25;

        const screeningBoxY = doc.y;
        const screeningBoxHeight = 280;
        const boxBorderRadius = 4;
        const boxFillColor = '#EAE6F0';
        const boxBorderColor = '#DCD9E4';

        doc.lineWidth(1)
           .roundedRect(40, screeningBoxY, doc.page.width - 80, screeningBoxHeight, boxBorderRadius)
           .fillAndStroke(boxFillColor, boxBorderColor);

        doc.y = screeningBoxY + 10;
        doc.x = 50;
        doc.fillColor('#333333');
        doc.fontSize(12).font('Helvetica-Bold').text('SCREENING REPORT:', { align: 'left' });
        doc.moveDown(1);

        const imageWidth = 150;
        const imageHeight = 112.5;
        const imageY = doc.y;
        const imageSpacing = (doc.page.width - 100 - 3 * imageWidth) / 2;
        const x1 = 50;
        const x2 = x1 + imageWidth + imageSpacing;
        const x3 = x2 + imageWidth + imageSpacing;

        try {
            for (let i = 0; i < Math.min(3, imageURLsToUse.length); i++) {
                const imgPath = imageURLsToUse[i];
                if (fs.existsSync(imgPath)) {
                    const xPos = i === 0 ? x1 : i === 1 ? x2 : x3;
                    doc.image(imgPath, xPos, imageY, { width: imageWidth, height: imageHeight });
                } else {
                    console.warn(`Image not found: ${imgPath}`);
                }
            }
        } catch (error) {
            console.error("Could not add images:", error);
        }

        const labelY = imageY + imageHeight + 15;
        const labels = ['Upper Teeth', 'Front Teeth', 'Lower Teeth'];
        labels.forEach((label, i) => {
            const xPos = i === 0 ? x1 : i === 1 ? x2 : x3;
            drawLabelButton(doc, xPos, labelY, label);
        });

        const legendItems = [
            { text: 'Inflammed / Red gums', color: '#532E5E' },
            { text: 'Malaligned', color: '#F5D953' },
            { text: 'Receded gums', color: '#B2A0C2' },
            { text: 'Stains', color: '#D33E3E' },
            { text: 'Attrition', color: '#58C3D1' },
            { text: 'Crowns', color: '#D93685' }
        ];
        
        const legendY = labelY + 45;
        const legendItemWidth = (doc.page.width - 120) / 3;
        const rectSize = 6;
        const textOffsetX = 10;

        legendItems.forEach((item, i) => {
            const row = Math.floor(i / 3);
            const col = i % 3;
            const x = 55 + col * legendItemWidth;
            const y = legendY + row * 20;

            doc.rect(x, y, rectSize, rectSize).fill(item.color);
            doc.fillColor('#333333').font('Helvetica').fontSize(9)
               .text(item.text, x + textOffsetX, y, { lineBreak: false });
        });


        doc.y = screeningBoxY + screeningBoxHeight + 20;
        if (submission.findings) {
            doc.fontSize(10).font('Helvetica');

            const f = submission.findings;
            if (f.upperTeeth) doc.text(`Upper Teeth: ${f.upperTeeth}`).moveDown(0.3);
            if (f.frontTeeth) doc.text(`Front Teeth: ${f.frontTeeth}`).moveDown(0.3);
            if (f.lowerTeeth) doc.text(`Lower Teeth: ${f.lowerTeeth}`).moveDown(0.3);

            const boolF = [];
            if (f.recededGums) boolF.push('Receded Gums');
            if (f.stains) boolF.push('Stains');
            if (f.attrition) boolF.push('Attrition');
            if (f.crowns) boolF.push('Crowns');
            if (boolF.length > 0) doc.text(`Conditions detected: ${boolF.join(', ')}`).moveDown(0.3);
            if (f.otherFindings) doc.text(`Additional findings: ${f.otherFindings}`).moveDown(0.3);
            doc.moveDown(1);
        }


        if (submission.recommendations) {
            doc.fillColor('black'); // Set text color to black
            doc.fontSize(14).font('Helvetica-Bold').text('Treatment Recommendations:', 40);
            doc.moveDown(0.5);

            const r = submission.recommendations;
            const recommendationX = 40;
            const recRectSize = 6;
            const recTextOffsetX = 10;
            const recommendationLabelX = recommendationX + recTextOffsetX;
            const colonX = 170;
            const recommendationTextX = 180;

            const recommendationItemsMap = {
                inflamedGums: { text: 'Inflammed / Red gums', color: '#532E5E' },
                malaligned:   { text: 'Malaligned', color: '#F5D953' },
                recededGums:  { text: 'Receded gums', color: '#B2A0C2' },
                stains:       { text: 'Stains', color: '#D33E3E' },
                attrition:    { text: 'Attrition', color: '#58C3D1' },
                crowns:       { text: 'Crowns', color: '#D93685' }
            };
            
            const recommendationOrder = ['inflamedGums', 'malaligned', 'recededGums', 'stains', 'attrition', 'crowns'];

            recommendationOrder.forEach(key => {
                if (r[key]) {
                    const item = recommendationItemsMap[key];
                    const currentY = doc.y;

                    doc.rect(recommendationX, currentY + 2, recRectSize, recRectSize).fill(item.color);
                    doc.fillColor('black');
                    
                    doc.font('Helvetica-Bold').fontSize(10)
                       .text(item.text, recommendationLabelX, currentY);
                    
                    doc.text(':', colonX, currentY);

                    doc.font('Helvetica').fontSize(10)
                       .text(r[key], recommendationTextX, currentY, {
                           width: doc.page.width - recommendationTextX - 40
                       });
                    
                    doc.moveDown(1);
                }
            });

            if (r.otherRecommendations) {
                const currentY = doc.y;
                doc.font('Helvetica-Bold').fontSize(10)
                   .text('Other', recommendationLabelX, currentY);
                doc.text(':', colonX, currentY);
                doc.font('Helvetica').fontSize(10)
                   .text(r.otherRecommendations, recommendationTextX, currentY, {
                       width: doc.page.width - recommendationTextX - 40
                   });
            }
            
            doc.fillColor('#333333');
        }

       

        doc.end();
        writeStream.on('finish', () => resolve());
        writeStream.on('error', err => reject(err));
    });
};

module.exports = generateOralHealthReport;

