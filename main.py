import sys
from app import app

if __name__ == '__main__':
    try:
        port = int(sys.argv[1])
    except IndexError:
        print('Please specify the port.')
        sys.exit(1)
    app.run(port=port, debug=True)