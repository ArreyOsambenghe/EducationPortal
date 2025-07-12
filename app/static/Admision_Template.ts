const Admision_Template = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Admission Letter - Kelden University</title>
    <style>
        /* Reset and base styles */
        @import url('https://fonts.googleapis.com/css2?family=Roboto:ital,wght@0,100..900;1,100..900&display=swap');
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
            font-family: 'Roboto', sans-serif;
        }

        /* A4 paper dimensions and print optimization */
        @page {
            size: A4;
            margin: 2cm 2.5cm;
        }

        body {
            font-family: 'Georgia', 'Times New Roman', serif;
            font-size: 12pt;
            line-height: 1.6;
            color: #333;
            background: white;
            max-width: 21cm;
            min-height: 29.7cm;
            margin: 0 auto;
            padding: 0;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
        }

        /* Header section */
        .letter-header {
            text-align: center;
            margin-bottom: 40px;
            border-bottom: 2px solid #1e40af;
            padding-bottom: 20px;
        }

        .university-logo {
            width: 80px;
            height: 80px;
            margin: 0 auto 15px;
            background: #f3f4f6;
            border: 2px solid #e5e7eb;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 24px;
            font-weight: bold;
            color: #1e40af;
        }

        .university-name {
            font-size: 24pt;
            font-weight: bold;
            color: #1e40af;
            margin-bottom: 5px;
            letter-spacing: 1px;
        }

        .university-tagline {
            font-size: 11pt;
            color: #6b7280;
            font-style: italic;
            margin-bottom: 20px;
        }

        /* Letter title */
        .letter-title {
            font-size: 28pt;
            font-weight: bold;
            text-align: center;
            color: #1e40af;
            margin: 30px 0;
            text-transform: uppercase;
            letter-spacing: 2px;
            border: 3px solid #1e40af;
            padding: 15px;
            background: #f8fafc;
        }

        /* Date section */
        .letter-date {
            text-align: right;
            margin-bottom: 30px;
            font-size: 11pt;
            color: #4b5563;
        }

        .date-label {
            font-weight: bold;
        }

        /* Letter content */
        .letter-content {
            margin-bottom: 50px;
            text-align: justify;
        }

        .greeting {
            font-size: 13pt;
            font-weight: bold;
            margin-bottom: 20px;
            color: #1f2937;
        }

        .main-paragraph {
            margin-bottom: 20px;
            font-size: 12pt;
            line-height: 1.8;
        }

        .admission-details {
            background: #f0f9ff;
            border-left: 4px solid #1e40af;
            padding: 20px;
            margin: 25px 0;
            border-radius: 0 8px 8px 0;
        }

        .admission-details h3 {
            color: #1e40af;
            font-size: 14pt;
            margin-bottom: 15px;
            font-weight: bold;
        }

        .detail-item {
            margin-bottom: 8px;
            font-size: 11pt;
        }

        .detail-label {
            font-weight: bold;
            color: #374151;
            display: inline-block;
            width: 120px;
        }

        .detail-value {
            color: #1e40af;
            font-weight: 600;
        }

        .congratulations {
            background: #f0fdf4;
            border: 1px solid #bbf7d0;
            padding: 20px;
            margin: 25px 0;
            border-radius: 8px;
            text-align: center;
        }

        .congratulations h3 {
            color: #166534;
            font-size: 16pt;
            margin-bottom: 10px;
            font-weight: bold;
        }

        .congratulations p {
            color: #15803d;
            font-size: 12pt;
            font-style: italic;
        }

        /* Instructions section */
        .next-steps {
            margin: 30px 0;
            padding: 20px;
            background: #fffbeb;
            border: 1px solid #fbbf24;
            border-radius: 8px;
        }

        .next-steps h3 {
            color: #92400e;
            font-size: 14pt;
            margin-bottom: 15px;
            font-weight: bold;
        }

        .next-steps ul {
            list-style-type: none;
            padding-left: 0;
        }

        .next-steps li {
            margin-bottom: 8px;
            padding-left: 20px;
            position: relative;
            font-size: 11pt;
            color: #78350f;
        }

        .next-steps li:before {
            content: "→";
            position: absolute;
            left: 0;
            color: #f59e0b;
            font-weight: bold;
        }

        /* Footer section */
        .letter-footer {
            margin-top: 50px;
            position: relative;
            min-height: 150px;
        }

        .signature-section {
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
            margin-bottom: 30px;
        }

        .signature-left {
            flex: 1;
        }

        .signature-right {
            flex: 1;
            text-align: right;
        }

        .signature-line {
            border-bottom: 1px solid #374151;
            width: 200px;
            margin-bottom: 5px;
        }

        .signature-label {
            font-size: 10pt;
            color: #6b7280;
            font-weight: bold;
        }

        .registrar-name {
            font-size: 12pt;
            font-weight: bold;
            color: #1f2937;
            margin-top: 5px;
        }

        .registrar-title {
            font-size: 10pt;
            color: #6b7280;
            font-style: italic;
        }

        .stamp-placeholder {
            position: absolute;
            bottom: 20px;
            right: 0;
            width: 100px;
            height: 100px;
            border: 2px dashed #d1d5db;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 9pt;
            color: #9ca3af;
            text-align: center;
            background: #f9fafb;
        }

        /* Contact information */
        .contact-info {
            border-top: 1px solid #e5e7eb;
            padding-top: 20px;
            margin-top: 30px;
            text-align: center;
            font-size: 10pt;
            color: #6b7280;
            line-height: 1.4;
        }

        .contact-info h4 {
            color: #1e40af;
            font-size: 11pt;
            margin-bottom: 10px;
            font-weight: bold;
        }

        .contact-details {
            display: flex;
            justify-content: center;
            gap: 30px;
            flex-wrap: wrap;
        }

        .contact-item {
            display: flex;
            align-items: center;
            gap: 5px;
        }

        /* Print-specific styles */
        @media print {
            body {
                margin: 0;
                padding: 0;
            }
            
            .letter-header {
                page-break-inside: avoid;
            }
            
            .admission-details {
                page-break-inside: avoid;
            }
            
            .next-steps {
                page-break-inside: avoid;
            }
            
            .letter-footer {
                page-break-inside: avoid;
            }
        }

        /* Placeholder styling */
        .placeholder {
            background: #fef3c7;
            padding: 2px 4px;
            border-radius: 3px;
            font-weight: bold;
            color: #92400e;
        }
    </style>
</head>
<body>
    <!-- Letter Header -->
    <div class="letter-header">
        <div class="university-logo">
            KU
        </div>
        <div class="university-name">KELDEN UNIVERSITY</div>
        <div class="university-tagline">Excellence in Education • Innovation in Learning</div>
    </div>

    <!-- Letter Title -->
    <div class="letter-title">
        Admission Letter
    </div>

    <!-- Date -->
    <div class="letter-date">
        <span class="date-label">Date:</span> <span class="placeholder">{{currentDate}}</span>
    </div>

    <!-- Letter Content -->
    <div class="letter-content">
        <div class="greeting">
            Dear <span class="placeholder">{{studentName}}</span>,
        </div>

        <div class="congratulations">
            <h3>🎉 CONGRATULATIONS! 🎉</h3>
            <p>You have been successfully admitted to Kelden University</p>
        </div>

        <p class="main-paragraph">
            We are delighted to inform you that you have been <strong>officially admitted</strong> to 
            <span class="placeholder">{{program}}</span> at Kelden University for the academic year 
            <span class="placeholder">{{admissionYear}}</span>.
        </p>

        <p class="main-paragraph">
            After careful review of your academic credentials, personal statement, and supporting documents, 
            the Admissions Committee has determined that you possess the academic excellence and potential 
            that align with our university's standards and values.
        </p>

        <div class="admission-details">
            <h3>Admission Details</h3>
            <div class="detail-item">
                <span class="detail-label">Student Name:</span>
                <span class="detail-value placeholder">{{studentName}}</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">Program:</span>
                <span class="detail-value placeholder">{{program}}</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">Academic Year:</span>
                <span class="detail-value placeholder">{{admissionYear}}</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">Matricule Number:</span>
                <span class="detail-value placeholder">{{matriculeNumber}}</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">Admission Date:</span>
                <span class="detail-value placeholder">{{currentDate}}</span>
            </div>
        </div>

        <p class="main-paragraph">
            This admission is contingent upon your continued academic performance and completion of any 
            outstanding requirements. You are expected to maintain the high standards that led to your 
            acceptance into our prestigious institution.
        </p>

        <div class="next-steps">
            <h3>Next Steps - Important Information</h3>
            <ul>
                <li>Submit all required documentation to the Registrar's Office</li>
                <li>Pay the required tuition fees and deposits</li>
                <li>Attend the mandatory orientation session</li>
                <li>Register for your first semester courses</li>
                <li>Obtain your student ID card from Student Services</li>
            </ul>
        </div>

        <p class="main-paragraph">
            We look forward to welcoming you to the Kelden University community and supporting you 
            throughout your academic journey. Should you have any questions regarding your admission 
            or enrollment process, please do not hesitate to contact our Admissions Office.
        </p>

        <p class="main-paragraph">
            Once again, congratulations on this significant achievement. We are confident that you 
            will make valuable contributions to our university community and achieve great success 
            in your chosen field of study.
        </p>
    </div>

    <!-- Letter Footer -->
    <div class="letter-footer">
        <div class="signature-section">
            <div class="signature-left">
                <div class="signature-line"></div>
                <div class="signature-label">Date</div>
            </div>
            <div class="signature-right">
                <div class="signature-line"></div>
                <div class="signature-label">Authorized Signature</div>
                <div class="registrar-name placeholder">{{registrarName}}</div>
                <div class="registrar-title">Registrar & Director of Admissions</div>
            </div>
        </div>

        <!-- Official Stamp Placeholder -->
        <div class="stamp-placeholder">
            OFFICIAL<br>STAMP<br>HERE
        </div>
    </div>

    <!-- Contact Information -->
    <div class="contact-info">
        <h4>KELDEN UNIVERSITY - ADMISSIONS OFFICE</h4>
        <div class="contact-details">
            <div class="contact-item">
                📍 123 University Avenue, Academic City, AC 12345
            </div>
            <div class="contact-item">
                📞 +1 (555) 123-4567
            </div>
            <div class="contact-item">
                ✉️ admissions@kelden.edu
            </div>
            <div class="contact-item">
                🌐 www.kelden.edu
            </div>
        </div>
    </div>
</body>
</html>
`;

export default Admision_Template;